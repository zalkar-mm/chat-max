import { type ReactNode, useEffect } from 'react'

import { SIGN_IN_ERROR_TEXT } from './model/sign-in-errors'
import { abortSignInCheck, restoreSession } from './model/sign-in-flow'
import { useSignInFlowStore } from './model/sign-in-flow.store'
import { RestoreFailedScreen } from './ui/restore-failed-screen'
import { Splash } from './ui/splash'

type RestoreSessionGateProps = {
  children: ReactNode
}

const OFFLINE_DESCRIPTION = 'Проверьте интернет и попробуйте снова'

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
    return abortSignInCheck
  }, [isRestoring])

  if (step.kind === 'restoring') return <Splash />
  if (step.kind === 'restoreFailed') {
    const description =
      step.error === 'offline' ? OFFLINE_DESCRIPTION : SIGN_IN_ERROR_TEXT[step.error]
    return (
      <RestoreFailedScreen
        description={description}
        isRetrying={step.isRetrying}
        onRetry={handleRetry}
      />
    )
  }
  return children
}
