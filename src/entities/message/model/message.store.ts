import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import type {
  Message,
  MessageId,
  OutgoingDelivery,
  OutgoingMessage,
  SendFailure,
} from './message.types'

type MessageState = {
  byId: Record<MessageId, Message>
  idsByChat: Record<string, MessageId[]>
}

const INITIAL: MessageState = { byId: {}, idsByChat: {} }

const EMPTY_IDS: readonly MessageId[] = Object.freeze([])

export const useMessageStore = create<MessageState>()(() => INITIAL)

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
    createdAt: now,
    direction: 'outgoing',
    delivery: { status: 'sending' },
  }
  useMessageStore.setState((state) => ({
    byId: { ...state.byId, [message.id]: message },
    idsByChat: {
      ...state.idsByChat,
      [chatId]: [...(state.idsByChat[chatId] ?? []), message.id],
    },
  }))
  return message
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
  setDelivery(id, { status: 'sent', idMessage })
}

export function markMessageFailed(id: MessageId, failure: SendFailure) {
  setDelivery(id, { status: 'failed', failure })
}

export function getMessage(id: MessageId): Message | null {
  return useMessageStore.getState().byId[id] ?? null
}

export function clearMessages() {
  useMessageStore.setState(INITIAL, true)
}

export const useMessage = (id: MessageId): Message | null =>
  useMessageStore((state) => state.byId[id] ?? null)

export const useChatMessageIds = (chatId: string): readonly MessageId[] =>
  useMessageStore((state) => state.idsByChat[chatId] ?? EMPTY_IDS)

export const useLastMessage = (chatId: string): Message | null =>
  useMessageStore((state) => {
    const lastId = state.idsByChat[chatId]?.at(-1)
    if (lastId === undefined) return null
    return state.byId[lastId] ?? null
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
