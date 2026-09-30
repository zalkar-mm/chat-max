import type { Message } from '@/entities/message/model/message.types'

import { retryMessage } from './model/send-queue'
import { SendFailureIcon, SendFailureNotice } from './ui/send-failure'

type MessageSendFailureProps = {
  message: Message
}

const getFailure = (message: Message) =>
  message.direction === 'outgoing' && message.delivery.status === 'failed'
    ? message.delivery.failure
    : null

/** Подпись под пузырём неотправленного сообщения с «Повторить». */
export function MessageSendFailure({ message }: MessageSendFailureProps) {
  const failure = getFailure(message)
  if (failure === null) return null

  const handleRetry = () => {
    retryMessage(message.id)
  }

  return <SendFailureNotice failure={failure} onRetry={handleRetry} />
}

/** Иконка ошибки слева от пузыря. */
export function MessageSendFailureIcon({ message }: MessageSendFailureProps) {
  if (getFailure(message) === null) return null
  return <SendFailureIcon />
}
