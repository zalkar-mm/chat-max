import { checkInstanceState } from '@/entities/session/api/check-instance-state'
import { type InstanceState, isUsableInstanceState } from '@/entities/session/model/instance-state'
import { useSessionStore } from '@/entities/session/model/session.store'
import { clearStoredSession } from '@/entities/session/model/session-storage'

import { ApiErrorKind, toApiError } from '@/shared/api/api-error'

import type { SignInValues } from './sign-in.schema'
import { isInvalidCredentialsError, type SignInErrorKind } from './sign-in-errors'
import {
  FORM_STEP,
  getSignInStep,
  type PendingSignIn,
  resetSignInFlow,
  setSignInDraft,
  setSignInStep,
} from './sign-in-flow.store'
import { createStartingPoller } from './starting-poller'

type CheckResult = { ok: true; state: InstanceState } | { ok: false; error: SignInErrorKind | null }

let checkController: AbortController | null = null

const toSignInError = (error: unknown): SignInErrorKind | null => {
  const { kind } = toApiError(error)
  return kind === ApiErrorKind.Aborted ? null : kind
}

async function runCheck({ credentials }: PendingSignIn): Promise<CheckResult> {
  checkController?.abort()
  const controller = new AbortController()
  checkController = controller
  try {
    const state = await checkInstanceState(credentials, controller.signal)
    // Ответ мог прийти раньше, чем отмена: результат отменённой проверки не применяем.
    if (controller.signal.aborted) return { ok: false, error: null }
    return { ok: true, state }
  } catch (error) {
    if (controller.signal.aborted) return { ok: false, error: null }
    return { ok: false, error: toSignInError(error) }
  } finally {
    if (checkController === controller) checkController = null
  }
}

function enterSession(pending: PendingSignIn, state: InstanceState) {
  useSessionStore.getState().startSession({ ...pending, instanceState: state })
  resetSignInFlow()
}

/** Результат проверки → вход или блокирующий экран. Автоперепроверку `starting` запускает экран статуса. */
function applyState(pending: PendingSignIn, state: InstanceState) {
  if (isUsableInstanceState(state)) {
    enterSession(pending, state)
    return
  }
  setSignInStep({
    kind: 'status',
    state,
    pending,
    isRechecking: false,
    attempt: 0,
    isStartingTimedOut: false,
    error: null,
  })
}

function showFormError(error: SignInErrorKind) {
  setSignInStep({ ...FORM_STEP, error })
}

export async function submitSignIn(values: SignInValues) {
  const step = getSignInStep()
  if (step.kind === 'form' && step.isChecking) return

  const { remember, ...credentials } = values
  const pending: PendingSignIn = { credentials, remember }
  setSignInDraft(values)
  setSignInStep({ ...FORM_STEP, isChecking: true })

  const result = await runCheck(pending)
  if (result.ok) {
    applyState(pending, result.state)
    return
  }
  if (result.error) showFormError(result.error)
}

export async function recheckInstance() {
  const step = getSignInStep()
  if (step.kind !== 'status' || step.isRechecking) return

  setSignInStep({ ...step, isRechecking: true, error: null })
  const result = await runCheck(step.pending)
  if (result.ok) {
    applyState(step.pending, result.state)
    return
  }
  if (result.error === null) return
  if (isInvalidCredentialsError(result.error)) {
    showFormError(result.error)
    return
  }
  setSignInStep({ ...step, isRechecking: false, error: result.error })
}

/**
 * Автоперепроверка `starting`: 10 с × 30. Возвращает остановку — её вызывает очистка эффекта экрана,
 * поэтому опрос живёт ровно столько, сколько виден экран «Инстанс запускается».
 */
export function startStartingRecheck(pending: PendingSignIn) {
  const poller = createStartingPoller({
    check: (signal) => checkInstanceState(pending.credentials, signal),
    onAttempt: (attempt) => {
      const step = getSignInStep()
      if (step.kind === 'status') setSignInStep({ ...step, attempt })
    },
    onResolved: (state) => {
      applyState(pending, state)
    },
    onGiveUp: () => {
      const step = getSignInStep()
      if (step.kind === 'status') setSignInStep({ ...step, isStartingTimedOut: true })
    },
    isFatalError: (error) => {
      const kind = toSignInError(error)
      return kind !== null && isInvalidCredentialsError(kind)
    },
    onFatalError: (error) => {
      const kind = toSignInError(error)
      if (kind) showFormError(kind)
    },
  })
  poller.start()
  return poller.stop
}

/** «Изменить данные» и «Отмена»: к форме с введёнными значениями, без выхода. */
export function editCredentials() {
  checkController?.abort()
  setSignInStep(FORM_STEP)
}

export function clearSignInError() {
  const step = getSignInStep()
  if (step.kind !== 'form') return
  if (step.error === null && !step.isSessionExpired) return
  setSignInStep({ ...step, error: null, isSessionExpired: false })
}

/** Старт приложения с сохранёнными кредами: не доверяем им вслепую, проверяем ещё раз. */
export async function restoreSession() {
  const step = getSignInStep()
  if (step.kind !== 'restoring' && step.kind !== 'restoreFailed') return
  const { pending } = step
  if (step.kind === 'restoreFailed') setSignInStep({ ...step, isRetrying: true })

  const result = await runCheck(pending)
  if (result.ok) {
    applyState(pending, result.state)
    return
  }
  if (result.error === null) return
  if (isInvalidCredentialsError(result.error)) {
    clearStoredSession()
    setSignInDraft(null)
    setSignInStep({ ...FORM_STEP, isSessionExpired: true })
    return
  }
  setSignInStep({ kind: 'restoreFailed', pending, isRetrying: false, error: result.error })
}

/** Отмена проверки в полёте (размонтирование гейта в StrictMode). */
export function abortSignInCheck() {
  checkController?.abort()
  checkController = null
}
