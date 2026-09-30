import { CircleAlert } from 'lucide-react'

import type { SendFailure } from '@/entities/message/model/message.types'

import { Button } from '@/shared/ui/button'
import { Gate } from '@/shared/ui/gate'

import { SEND_FAILURE_TEXT } from '../model/send-failure-text'

type SendFailureNoticeProps = {
  failure: SendFailure
  onRetry: () => void
}

/** Строка под пузырём: что пошло не так и «Повторить». */
export function SendFailureNotice({ failure, onRetry }: SendFailureNoticeProps) {
  const { text, canRetry } = SEND_FAILURE_TEXT[failure]

  return (
    <p className="mt-1 flex flex-wrap items-center justify-end gap-x-1 text-right typo-description text-negative-strong">
      <span>{text}</span>
      <Gate when={canRetry}>
        <RetryLink onRetry={onRetry} />
      </Gate>
    </p>
  )
}

type RetryLinkProps = {
  onRetry: () => void
}

function RetryLink({ onRetry }: RetryLinkProps) {
  return (
    <Button
      variant="plain"
      className="-my-2 inline w-auto py-2 font-medium text-negative-strong underline"
      onClick={onRetry}
    >
      Повторить
    </Button>
  )
}

export function SendFailureIcon() {
  return <CircleAlert className="mb-1 size-5 shrink-0 text-bubble-status-error" aria-hidden />
}
