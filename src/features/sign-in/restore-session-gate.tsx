import { type ReactNode, useEffect } from 'react'

import { restoreSession, stopSignInChecks } from './model/sign-in-flow'
import { useSignInFlowStore } from './model/sign-in-flow.store'
import { RestoreFailedScreen } from './ui/restore-failed-screen'
import { Splash } from './ui/splash'

type RestoreSessionGateProps = {
  children: ReactNode
}

const handleRetry = () => {
  void restoreSession()
}

/** Пока сохранённая сессия проверяется — сплэш, форма входа не мелькает. */
export function RestoreSessionGate({ children }: RestoreSessionGateProps) {
  const step = useSignInFlowStore((state) => state.step)
  const isRestoring = step.kind === 'restoring'

  useEffect(() => {
    if (!isRestoring) return
    void restoreSession()
    return stopSignInChecks
  }, [isRestoring])

  if (step.kind === 'restoring') return <Splash />
  if (step.kind === 'restoreFailed') {
    return <RestoreFailedScreen isRetrying={step.isRetrying} onRetry={handleRetry} />
  }
  return children
}
