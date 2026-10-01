import { touchChat } from '@/entities/chat/model/chat.store'
import { sendTextMessage } from '@/entities/message/api/send-text-message'
import { toSendFailure } from '@/entities/message/lib/to-send-failure'
import {
  addOutgoingMessage,
  getMessage,
  markMessageFailed,
  markMessageSending,
  markMessageSent,
} from '@/entities/message/model/message.store'
import type { MessageId } from '@/entities/message/model/message.types'
import { InstanceState } from '@/entities/session/model/instance-state'
import { getSessionCredentials, useSessionStore } from '@/entities/session/model/session.store'

import { ApiErrorKind } from '@/shared/api/api-error'

import { createSendQueue } from './create-send-queue'

const sendQueue = createSendQueue(
  {
    getCredentials: getSessionCredentials,
    getPendingMessage: (id) => {
      const message = getMessage(id)
      if (message?.direction !== 'outgoing' || message.delivery.status !== 'sending') return null
      return { chatId: message.chatId, text: message.text }
    },
    send: sendTextMessage,
    onSent: markMessageSent,
    onFailed: (id, failure, kind) => {
      markMessageFailed(id, failure ?? 'failed')
      // 403 при отправке — аккаунт ограничен: показываем жёлтый баннер спринта 1.
      if (kind === ApiErrorKind.Forbidden) {
        useSessionStore.getState().setInstanceState(InstanceState.Suspended)
      }
      // 466 — лимит тарифа: кроме ошибки у сообщения, общий жёлтый баннер.
      if (kind === ApiErrorKind.QuotaExceeded) useSessionStore.getState().markQuotaExceeded()
    },
  },
  toSendFailure,
)

/** Сообщение сразу в ленте со статусом «отправляется», чат наверх, отправка — в очередь. */
export function sendMessage(chatId: string, text: string) {
  const message = addOutgoingMessage({ chatId, text: text.trim(), now: Date.now() })
  touchChat(chatId, message.createdAt)
  sendQueue.enqueue(message.id)
}

/** «Повторить»: то же сообщение снова «отправляется», на своём месте в ленте, без дубля. */
export function retryMessage(id: MessageId) {
  const message = getMessage(id)
  if (message?.direction !== 'outgoing' || message.delivery.status !== 'failed') return
  markMessageSending(id)
  sendQueue.enqueue(id)
}

let stopSendQueue: (() => void) | null = null

/** Запускается из app (идемпотентно): выход из сессии обрывает очередь и запрос в полёте. */
export function startSendQueue() {
  if (stopSendQueue) return stopSendQueue
  const unsubscribe = useSessionStore.subscribe((state, previous) => {
    if (previous.credentials && !state.credentials) sendQueue.reset()
  })
  stopSendQueue = () => {
    unsubscribe()
    sendQueue.reset()
    stopSendQueue = null
  }
  return stopSendQueue
}
