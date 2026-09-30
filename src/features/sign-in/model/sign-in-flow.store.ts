import { create } from 'zustand'

import type { BlockingInstanceState } from '@/entities/session/model/instance-state'
import { readStoredSession } from '@/entities/session/model/session-storage'

import type { Credentials } from '@/shared/api/credentials'

import type { SignInValues } from './sign-in.schema'
import type { SignInErrorKind } from './sign-in-errors'

export type PendingSignIn = {
  credentials: Credentials
  remember: boolean
}

export type SignInStep =
  | { kind: 'restoring'; pending: PendingSignIn }
  | {
      kind: 'restoreFailed'
      pending: PendingSignIn
      isRetrying: boolean
      error: SignInErrorKind
    }
  | {
      kind: 'form'
      isChecking: boolean
      error: SignInErrorKind | null
      isSessionExpired: boolean
    }
  | {
      kind: 'status'
      state: BlockingInstanceState
      pending: PendingSignIn
      isRechecking: boolean
      attempt: number
      isStartingTimedOut: boolean
      /** Ошибка «Проверить снова»: показываем на самом экране статуса, контекст не теряется. */
      error: SignInErrorKind | null
    }

type SignInFlowState = {
  step: SignInStep
  /** Введённые значения: «Изменить данные» возвращает к форме с ними. */
  draft: SignInValues | null
}

export type FormStep = Extract<SignInStep, { kind: 'form' }>

export const FORM_STEP: FormStep = {
  kind: 'form',
  isChecking: false,
  error: null,
  isSessionExpired: false,
}

const toDraft = ({ credentials, remember }: PendingSignIn): SignInValues => ({
  ...credentials,
  remember,
})

const INITIAL_STATE: SignInFlowState = { step: FORM_STEP, draft: null }

function readInitialState(): SignInFlowState {
  const stored = readStoredSession()
  if (!stored) return INITIAL_STATE
  return { step: { kind: 'restoring', pending: stored }, draft: toDraft(stored) }
}

export const useSignInFlowStore = create<SignInFlowState>()(() => INITIAL_STATE)

export const setSignInStep = (step: SignInStep) => {
  useSignInFlowStore.setState({ step })
}

export const setSignInDraft = (draft: SignInValues | null) => {
  useSignInFlowStore.setState({ draft })
}

export const getSignInStep = () => useSignInFlowStore.getState().step

/** Старт приложения: по хранилищу решить, восстанавливать ли сессию. Вызывается явно до рендера. */
export const initSignInFlow = () => {
  useSignInFlowStore.setState(readInitialState())
}

export const resetSignInFlow = () => {
  useSignInFlowStore.setState(INITIAL_STATE)
}
