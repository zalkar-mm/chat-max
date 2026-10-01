import { create } from 'zustand'

import type { Credentials } from '@/shared/api/credentials'

import { InstanceState } from './instance-state'
import { clearStoredSession, saveStoredSession } from './session-storage'

/** Почему сессия закончилась: «истекла» показывает на входе «Сессия недействительна, войдите снова». */
export type SessionEndReason = 'signOut' | 'expired'

type SessionState = {
  credentials: Credentials | null
  remember: boolean
  instanceState: InstanceState | null
  isSuspendedBannerDismissed: boolean
  isQuotaExceeded: boolean
  isQuotaBannerDismissed: boolean
  endReason: SessionEndReason | null
  startSession: (session: {
    credentials: Credentials
    instanceState: InstanceState
    remember: boolean
  }) => void
  setInstanceState: (instanceState: InstanceState) => void
  dismissSuspendedBanner: () => void
  markQuotaExceeded: () => void
  dismissQuotaBanner: () => void
  clearEndReason: () => void
  endSession: (reason?: SessionEndReason) => void
}

const INITIAL = {
  credentials: null,
  remember: false,
  instanceState: null,
  isSuspendedBannerDismissed: false,
  isQuotaExceeded: false,
  isQuotaBannerDismissed: false,
  endReason: null,
} satisfies Partial<SessionState>

export const useSessionStore = create<SessionState>()((set, get) => ({
  ...INITIAL,
  startSession: ({ credentials, instanceState, remember }) => {
    saveStoredSession({ credentials, remember })
    set({ ...INITIAL, credentials, instanceState, remember })
  },
  setInstanceState: (instanceState) => {
    if (get().instanceState === instanceState) return
    set({ instanceState })
  },
  dismissSuspendedBanner: () => {
    set({ isSuspendedBannerDismissed: true })
  },
  markQuotaExceeded: () => {
    if (get().isQuotaExceeded) return
    set({ isQuotaExceeded: true })
  },
  dismissQuotaBanner: () => {
    set({ isQuotaBannerDismissed: true })
  },
  clearEndReason: () => {
    if (get().endReason !== null) set({ endReason: null })
  },
  endSession: (reason = 'signOut') => {
    clearStoredSession()
    set({ ...INITIAL, endReason: reason })
  },
}))

export const useIsSignedIn = () => useSessionStore((state) => state.credentials !== null)

export const useSessionIdInstance = () =>
  useSessionStore((state) => state.credentials?.idInstance ?? null)

export const useInstanceState = () => useSessionStore((state) => state.instanceState)

export const useIsSuspendedBannerVisible = () =>
  useSessionStore(
    (state) => state.instanceState === InstanceState.Suspended && !state.isSuspendedBannerDismissed,
  )

export const useIsQuotaBannerVisible = () =>
  useSessionStore((state) => state.isQuotaExceeded && !state.isQuotaBannerDismissed)

export const useIsSessionExpired = () => useSessionStore((state) => state.endReason === 'expired')

/** Вне React (сервисы): текущие креды или null. */
export const getSessionCredentials = () => useSessionStore.getState().credentials

/** Подписка вне React на начало и конец сессии: колбэк получает новые и прежние креды. */
export const subscribeToSessionChange = (
  listener: (current: Credentials | null, previous: Credentials | null) => void,
) =>
  useSessionStore.subscribe((state, previous) => {
    if (state.credentials !== previous.credentials)
      listener(state.credentials, previous.credentials)
  })
