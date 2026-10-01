import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { formatPhone } from '../lib/phone'

import type { Chat, ChatId } from './chat.types'

type ChatState = {
  ids: ChatId[]
  byId: Record<ChatId, Chat>
  chatIdByPhone: Record<string, ChatId>
  drafts: Record<ChatId, string>
}

const INITIAL: ChatState = {
  ids: [],
  byId: {},
  chatIdByPhone: {},
  drafts: {},
}

const useChatStore = create<ChatState>()(() => INITIAL)

type AddChatInput = {
  chatId: ChatId
  phone: string
  now: number
}

export function addChat({ chatId, phone, now }: AddChatInput): Chat {
  const state = useChatStore.getState()
  const chatIdByPhone = { ...state.chatIdByPhone, [phone]: chatId }
  const existing = state.byId[chatId]
  if (existing) {
    useChatStore.setState({ chatIdByPhone })
    return existing
  }

  const chat: Chat = {
    id: chatId,
    phone,
    title: formatPhone(phone),
    createdAt: now,
    lastActivityAt: now,
  }
  useChatStore.setState({
    ids: [...state.ids, chatId],
    byId: { ...state.byId, [chatId]: chat },
    chatIdByPhone,
  })
  return chat
}

export function touchChat(chatId: ChatId, at: number) {
  const chat = useChatStore.getState().byId[chatId]
  if (!chat || chat.lastActivityAt >= at) return
  useChatStore.setState((state) => ({
    byId: { ...state.byId, [chatId]: { ...chat, lastActivityAt: at } },
  }))
}

export function setChatDraft(chatId: ChatId, text: string) {
  useChatStore.setState((state) => ({ drafts: { ...state.drafts, [chatId]: text } }))
}

export function clearChats() {
  useChatStore.setState(INITIAL, true)
}

export function findChatIdByPhone(phone: string): ChatId | null {
  return useChatStore.getState().chatIdByPhone[phone] ?? null
}

export function getChat(chatId: ChatId): Chat | null {
  return useChatStore.getState().byId[chatId] ?? null
}

/** Свежие сверху; при равной активности — созданный позже (а при равном времени — добавленный позже). */
function selectSortedChatIds(state: ChatState): ChatId[] {
  return state.ids
    .map((id, index) => ({ chat: state.byId[id], index }))
    .filter((entry): entry is { chat: Chat; index: number } => entry.chat !== undefined)
    .sort(
      (left, right) =>
        right.chat.lastActivityAt - left.chat.lastActivityAt ||
        right.chat.createdAt - left.chat.createdAt ||
        right.index - left.index,
    )
    .map((entry) => entry.chat.id)
}

export const useChat = (chatId: ChatId) => useChatStore((state) => state.byId[chatId] ?? null)

/** Новый массив на каждый вызов селектора — useShallow держит ссылку, пока порядок не изменился. */
export const useSortedChatIds = () => useChatStore(useShallow(selectSortedChatIds))

export const useChatDraft = (chatId: ChatId) => useChatStore((state) => state.drafts[chatId] ?? '')
