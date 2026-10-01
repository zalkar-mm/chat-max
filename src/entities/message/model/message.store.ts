import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import type {
  DeliveryAck,
  DeliveryUpdate,
  Message,
  MessageContent,
  MessageId,
  OutgoingDelivery,
  OutgoingMessage,
  SendFailure,
} from './message.types'

type MessageState = {
  byId: Record<MessageId, Message>
  idsByChat: Record<string, MessageId[]>
  /** idMessage от API → локальный id: дедупликация эха и повторной доставки, привязка статусов. */
  idByApiId: Record<string, MessageId>
  /** Статус, пришедший раньше, чем отправка получила idMessage. */
  pendingUpdates: Record<string, DeliveryUpdate>
}

const INITIAL: MessageState = { byId: {}, idsByChat: {}, idByApiId: {}, pendingUpdates: {} }

const EMPTY_IDS: readonly MessageId[] = Object.freeze([])

export const useMessageStore = create<MessageState>()(() => INITIAL)

const ACK_RANK: Readonly<Record<DeliveryAck, number>> = { sent: 1, delivered: 2, read: 3 }

/**
 * Буфер ранних статусов ограничен: статусы чужих отправок (до входа, из другого клиента) никогда не найдут
 * своё сообщение. Самые старые вытесняются — объект хранит порядок вставки.
 */
const MAX_PENDING_UPDATES = 200

function withPendingUpdate(
  pending: Record<string, DeliveryUpdate>,
  idMessage: string,
  update: DeliveryUpdate,
) {
  const next = { ...pending, [idMessage]: update }
  const overflow = Object.keys(next).length - MAX_PENDING_UPDATES
  if (overflow <= 0) return next
  for (const key of Object.keys(next).slice(0, overflow)) delete next[key]
  return next
}

function appendMessage(state: MessageState, message: Message, idMessage: string | null) {
  return {
    byId: { ...state.byId, [message.id]: message },
    idsByChat: {
      ...state.idsByChat,
      [message.chatId]: [...(state.idsByChat[message.chatId] ?? []), message.id],
    },
    idByApiId:
      idMessage === null ? state.idByApiId : { ...state.idByApiId, [idMessage]: message.id },
  }
}

type AddOutgoingMessageInput = { chatId: string; text: string; now: number }

export function addOutgoingMessage({
  chatId,
  text,
  now,
}: AddOutgoingMessageInput): OutgoingMessage {
  const message: OutgoingMessage = {
    id: crypto.randomUUID(),
    chatId,
    text,
    content: 'text',
    createdAt: now,
    direction: 'outgoing',
    delivery: { status: 'sending' },
  }
  useMessageStore.setState((state) => appendMessage(state, message, null))
  return message
}

type SyncedMessageInput = {
  chatId: string
  idMessage: string
  text: string
  content: MessageContent
  createdAt: number
}

/** Входящее из очереди. false — такое сообщение уже есть (повторная доставка). */
export function addIncomingMessage(input: SyncedMessageInput): boolean {
  if (hasApiMessage(input.idMessage)) return false
  const message: Message = { ...input, id: crypto.randomUUID(), direction: 'incoming' }
  useMessageStore.setState((state) => appendMessage(state, message, input.idMessage))
  return true
}

/** Своё сообщение, отправленное не отсюда (с телефона) или эхо без подтверждения. false — уже есть. */
export function addSyncedOutgoingMessage({ idMessage, ...input }: SyncedMessageInput): boolean {
  if (hasApiMessage(idMessage)) return false
  const message: OutgoingMessage = {
    ...input,
    id: crypto.randomUUID(),
    direction: 'outgoing',
    delivery: { status: 'sent', idMessage },
  }
  useMessageStore.setState((state) => appendMessage(state, message, idMessage))
  applyPendingUpdate(idMessage)
  return true
}

function setDelivery(id: MessageId, delivery: OutgoingDelivery) {
  useMessageStore.setState((state) => {
    const message = state.byId[id]
    if (message?.direction !== 'outgoing') return state
    return { byId: { ...state.byId, [id]: { ...message, delivery } } }
  })
}

export function markMessageSending(id: MessageId) {
  setDelivery(id, { status: 'sending' })
}

export function markMessageSent(id: MessageId, idMessage: string) {
  const message = useMessageStore.getState().byId[id]
  if (message?.direction !== 'outgoing') return
  useMessageStore.setState((state) => ({
    byId: { ...state.byId, [id]: { ...message, delivery: { status: 'sent', idMessage } } },
    idByApiId: { ...state.idByApiId, [idMessage]: id },
  }))
  applyPendingUpdate(idMessage)
}

export function markMessageFailed(id: MessageId, failure: SendFailure) {
  setDelivery(id, { status: 'failed', failure })
}

function applyPendingUpdate(idMessage: string) {
  const update = useMessageStore.getState().pendingUpdates[idMessage]
  if (update === undefined) return
  useMessageStore.setState((state) => {
    const { [idMessage]: _applied, ...rest } = state.pendingUpdates
    return { pendingUpdates: rest }
  })
  applyDeliveryUpdate(idMessage, update)
}

/**
 * Статус доставки из очереди. Подтверждения только повышаются; «не доставлено» — только из «отправлено».
 * Неизвестный пока idMessage (ответ на sendMessage ещё не пришёл) — статус ждёт в буфере.
 */
export function applyDeliveryUpdate(idMessage: string, update: DeliveryUpdate) {
  const state = useMessageStore.getState()
  const id = state.idByApiId[idMessage]
  const message = id === undefined ? undefined : state.byId[id]
  if (id === undefined || message === undefined) {
    useMessageStore.setState({
      pendingUpdates: withPendingUpdate(state.pendingUpdates, idMessage, update),
    })
    return
  }
  if (message.direction !== 'outgoing') return
  const { delivery } = message
  if (delivery.status === 'sending' || delivery.status === 'failed') return

  if (update === 'failed') {
    if (delivery.status === 'sent') setDelivery(id, { status: 'failed', failure: 'undelivered' })
    return
  }
  if (ACK_RANK[update] > ACK_RANK[delivery.status]) setDelivery(id, { status: update, idMessage })
}

export function hasApiMessage(idMessage: string) {
  return useMessageStore.getState().idByApiId[idMessage] !== undefined
}

export function getMessage(id: MessageId): Message | null {
  return useMessageStore.getState().byId[id] ?? null
}

export function getAllMessages(): Message[] {
  return Object.values(useMessageStore.getState().byId)
}

/** Восстановление истории: то, что «отправлялось» до перезагрузки, — «не отправлено» (неизвестно, ушло ли). */
export function hydrateMessages(messages: readonly Message[]) {
  let state: MessageState = INITIAL
  const sorted = messages.toSorted((left, right) => left.createdAt - right.createdAt)
  for (const message of sorted) {
    const restored: Message =
      message.direction === 'outgoing' && message.delivery.status === 'sending'
        ? { ...message, delivery: { status: 'failed', failure: 'failed' } }
        : message
    state = { ...state, ...appendMessage(state, restored, getApiId(restored)) }
  }
  useMessageStore.setState(state, true)
}

export function getApiId(message: Message): string | null {
  if (message.direction === 'incoming') return message.idMessage
  return 'idMessage' in message.delivery ? message.delivery.idMessage : null
}

export function clearMessages() {
  useMessageStore.setState(INITIAL, true)
}

const byCreatedAt = (left: Message, right: Message) => left.createdAt - right.createdAt

/** Последнее по времени сообщение чата (события могут прийти не по порядку). */
export const useLastMessage = (chatId: string): Message | null =>
  useMessageStore((state) => {
    const ids = state.idsByChat[chatId] ?? EMPTY_IDS
    let last: Message | null = null
    for (const id of ids) {
      const message = state.byId[id]
      if (message && (last === null || byCreatedAt(message, last) >= 0)) last = message
    }
    return last
  })

/** Сообщения чата по порядку добавления; ссылка стабильна, пока не изменилось ни одно сообщение чата. */
export const useChatMessages = (chatId: string): readonly Message[] =>
  useMessageStore(
    useShallow((state) =>
      (state.idsByChat[chatId] ?? EMPTY_IDS)
        .map((id) => state.byId[id])
        .filter((message) => message !== undefined),
    ),
  )
