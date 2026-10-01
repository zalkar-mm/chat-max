import type { SendFailure } from '@/entities/message/model/message.types'

type FailureText = {
  text: string
  canRetry: boolean
}

export const SEND_FAILURE_TEXT: Readonly<Record<SendFailure, FailureText>> = {
  offline: { text: 'Нет соединения.', canRetry: true },
  suspended: {
    text: 'Не отправлено: аккаунт ограничен, можно писать только контактам.',
    canRetry: true,
  },
  quotaExceeded: { text: 'Не отправлено: исчерпан лимит бесплатного тарифа', canRetry: false },
  rejected: { text: 'Не отправлено: сервер отклонил сообщение.', canRetry: true },
  failed: { text: 'Не отправлено.', canRetry: true },
  undelivered: { text: 'Не доставлено.', canRetry: true },
}
