import { useEffect } from 'react'

import { Gate } from '@/shared/ui/gate'

import { SIGN_IN_ERROR_TEXT } from './model/sign-in-errors'
import { editCredentials, recheckInstance, startStartingRecheck } from './model/sign-in-flow'
import { type PendingSignIn, useSignInFlowStore } from './model/sign-in-flow.store'
import { useSignInForm } from './model/use-sign-in-form'
import { InstanceStatusScreen, type StatusView } from './ui/instance-status-screen'
import { SignInForm } from './ui/sign-in-form'

function SignInFormContainer() {
  const model = useSignInForm()
  return <SignInForm model={model} />
}

type StartingRecheckProps = {
  pending: PendingSignIn
}

/** Опрос живёт, пока смонтирован экран «Инстанс запускается»: уход с экрана его останавливает. */
function StartingRecheck({ pending }: StartingRecheckProps) {
  useEffect(() => startStartingRecheck(pending), [pending])
  return null
}

const handleRecheck = () => {
  void recheckInstance()
}

/** Экран входа: форма или блокирующий статус инстанса. */
export function SignInFlow() {
  const step = useSignInFlowStore((state) => state.step)

  if (step.kind !== 'status') return <SignInFormContainer />

  const view: StatusView = step.isStartingTimedOut ? 'startingTimedOut' : step.state
  const isAutoRechecking = view === 'starting' && !step.isRechecking
  const errorText = step.error ? SIGN_IN_ERROR_TEXT[step.error] : null

  return (
    <>
      <InstanceStatusScreen
        view={view}
        attempt={step.attempt}
        isRechecking={step.isRechecking}
        errorText={errorText}
        onRecheck={handleRecheck}
        onEdit={editCredentials}
        onCancel={editCredentials}
      />
      <Gate when={isAutoRechecking}>
        <StartingRecheck pending={step.pending} />
      </Gate>
    </>
  )
}
