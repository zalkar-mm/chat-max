import { checkInstanceState } from '@/entities/session/api/check-instance-state'
import {
  type InstanceState,
  InstanceState as State,
  isUsableInstanceState,
} from '@/entities/session/model/instance-state'
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
import { createStartingPoller, type StartingPoller } from './starting-poller'

type CheckResult = { ok: true; state: InstanceState } | { ok: false; error: SignInErrorKind | null }

let checkController: AbortController | null = null
let startingPoller: StartingPoller | null = null

async function runCheck({ credentials }: PendingSignIn): Promise<CheckResult> {
  checkController?.abort()
  const controller = new AbortController()
  checkController = controller
  try {
    const state = await checkInstanceState(credentials, controller.signal)
    return { ok: true, state }
  } catch (error) {
    const { kind } = toApiError(error)
    return { ok: false, error: kind === ApiErrorKind.Aborted ? null : kind }
  } finally {
    if (checkController === controller) checkController = null
  }
}

function stopBackgroundChecks() {
  checkController?.abort()
  checkController = null
  startingPoller?.stop()
  startingPoller = null
}

function enterSession(pending: PendingSignIn, state: InstanceState) {
  stopBackgroundChecks()
  useSessionStore.getState().startSession({ ...pending, instanceState: state })
  resetSignInFlow()
}

function startStartingPoller(pending: PendingSignIn) {
  startingPoller?.stop()
  startingPoller = createStartingPoller({
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
  })
  startingPoller.start()
}

/** Результат проверки → вход, блокирующий экран или автоперепроверка `starting`. */
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
  })
  if (state === State.Starting) startStartingPoller(pending)
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

  startingPoller?.stop()
  setSignInStep({ ...step, isRechecking: true })
  const result = await runCheck(step.pending)
  if (result.ok) {
    applyState(step.pending, result.state)
    return
  }
  if (result.error) showFormError(result.error)
}

/** «Изменить данные» и «Отмена»: к форме с введёнными значениями, без выхода. */
export function editCredentials() {
  stopBackgroundChecks()
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
  setSignInStep({ kind: 'restoreFailed', pending, isRetrying: false })
}

export function stopSignInChecks() {
  stopBackgroundChecks()
}
