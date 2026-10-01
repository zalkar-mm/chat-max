import {
  ensureChat,
  getViewedChatId,
  incrementUnread,
  touchChat,
} from '@/entities/chat/model/chat.store'
import {
  addIncomingMessage,
  addSyncedOutgoingMessage,
  applyDeliveryUpdate,
  hasApiMessage,
} from '@/entities/message/model/message.store'
import { useSessionStore } from '@/entities/session/model/session.store'

import type {
  IncomingMessageEvent,
  NotificationEvent,
  OutgoingMessageEvent,
} from './notification-event'

/** Эхо отправки пришло раньше ответа sendMessage: ждём подтверждения столько, потом показываем как своё. */
export const ECHO_CONFIRM_TIMEOUT_MS = 30_000

const pendingEchoes = new Map<string, ReturnType<typeof setTimeout>>()

const isChatOnScreen = (chatId: string) =>
  getViewedChatId() === chatId && document.visibilityState === 'visible'

function applyIncoming(event: IncomingMessageEvent) {
  ensureChat({ chatId: event.chatId, phone: event.phone, name: event.name, now: event.sentAt })
  const isAdded = addIncomingMessage({
    chatId: event.chatId,
    idMessage: event.idMessage,
    text: event.text,
    content: event.content,
    createdAt: event.sentAt,
  })
  if (!isAdded) return
  touchChat(event.chatId, event.sentAt)
  if (!isChatOnScreen(event.chatId)) incrementUnread(event.chatId)
}

function addOutgoing(event: OutgoingMessageEvent) {
  ensureChat({ chatId: event.chatId, now: event.sentAt })
  const isAdded = addSyncedOutgoingMessage({
    chatId: event.chatId,
    idMessage: event.idMessage,
    text: event.text,
    content: event.content,
    createdAt: event.sentAt,
  })
  if (isAdded) touchChat(event.chatId, event.sentAt)
}

function applyOutgoing(event: OutgoingMessageEvent) {
  if (hasApiMessage(event.idMessage)) return
  if (event.source === 'phone') {
    addOutgoing(event)
    return
  }
  // Эхо своей отправки, а ответ sendMessage ещё не пришёл: не дублируем. Не подтвердилась — показываем.
  if (pendingEchoes.has(event.idMessage)) return
  const timer = setTimeout(() => {
    pendingEchoes.delete(event.idMessage)
    if (!hasApiMessage(event.idMessage)) addOutgoing(event)
  }, ECHO_CONFIRM_TIMEOUT_MS)
  pendingEchoes.set(event.idMessage, timer)
}

/** Доменное событие → изменения сущностей. Синхронно: удаление из очереди идёт после. */
export function applyNotification(event: NotificationEvent) {
  switch (event.kind) {
    case 'incomingMessage':
      applyIncoming(event)
      return
    case 'outgoingMessage':
      applyOutgoing(event)
      return
    case 'deliveryStatus':
      applyDeliveryUpdate(event.idMessage, event.update)
      return
    case 'instanceState':
      useSessionStore.getState().setInstanceState(event.state)
      return
    case 'quotaExceeded':
      useSessionStore.getState().markQuotaExceeded()
      return
    case 'ignored':
      return
  }
}

export function resetPendingEchoes() {
  pendingEchoes.forEach((timer) => {
    clearTimeout(timer)
  })
  pendingEchoes.clear()
}
