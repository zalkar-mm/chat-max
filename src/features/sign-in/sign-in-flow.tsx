import { useEffect } from 'react'

import { editCredentials, recheckInstance, stopSignInChecks } from './model/sign-in-flow'
import { useSignInFlowStore } from './model/sign-in-flow.store'
import { useSignInForm } from './model/use-sign-in-form'
import { InstanceStatusScreen, type StatusView } from './ui/instance-status-screen'
import { SignInForm } from './ui/sign-in-form'

function SignInFormContainer() {
  const model = useSignInForm()
  return <SignInForm model={model} />
}

const handleRecheck = () => {
  void recheckInstance()
}

/** Экран входа: форма или блокирующий статус инстанса. */
export function SignInFlow() {
  const step = useSignInFlowStore((state) => state.step)

  useEffect(() => stopSignInChecks, [])

  if (step.kind !== 'status') return <SignInFormContainer />

  const view: StatusView = step.isStartingTimedOut ? 'startingTimedOut' : step.state

  return (
    <InstanceStatusScreen
      view={view}
      attempt={step.attempt}
      isRechecking={step.isRechecking}
      onRecheck={handleRecheck}
      onEdit={editCredentials}
      onCancel={editCredentials}
    />
  )
}
