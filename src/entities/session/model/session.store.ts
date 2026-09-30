import { create } from 'zustand'

import type { Credentials } from '@/shared/api/credentials'

import { InstanceState } from './instance-state'
import { clearStoredSession, saveStoredSession } from './session-storage'

type SessionState = {
  credentials: Credentials | null
  instanceState: InstanceState | null
  isSuspendedBannerDismissed: boolean
  startSession: (session: {
    credentials: Credentials
    instanceState: InstanceState
    remember: boolean
  }) => void
  setInstanceState: (instanceState: InstanceState) => void
  dismissSuspendedBanner: () => void
  endSession: () => void
}

const INITIAL = {
  credentials: null,
  instanceState: null,
  isSuspendedBannerDismissed: false,
} satisfies Partial<SessionState>

export const useSessionStore = create<SessionState>()((set) => ({
  ...INITIAL,
  startSession: ({ credentials, instanceState, remember }) => {
    saveStoredSession({ credentials, remember })
    set({ credentials, instanceState, isSuspendedBannerDismissed: false })
  },
  setInstanceState: (instanceState) => {
    set({ instanceState })
  },
  dismissSuspendedBanner: () => {
    set({ isSuspendedBannerDismissed: true })
  },
  endSession: () => {
    clearStoredSession()
    set(INITIAL)
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

/** Вне React (сервисы): текущие креды или null. */
export const getSessionCredentials = () => useSessionStore.getState().credentials
