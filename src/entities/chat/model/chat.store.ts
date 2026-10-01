import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { formatPhone } from '../lib/phone'

import type { Chat, ChatId } from './chat.types'

type ChatState = {
  ids: ChatId[]
  byId: Record<ChatId, Chat>
  chatIdByPhone: Record<string, ChatId>
  drafts: Record<ChatId, string>
  /** Чат, который пользователь сейчас видит на экране: в него входящие не считаются непрочитанными. */
  viewedChatId: ChatId | null
}

const INITIAL: ChatState = {
  ids: [],
  byId: {},
  chatIdByPhone: {},
  drafts: {},
  viewedChatId: null,
}

const useChatStore = create<ChatState>()(() => INITIAL)

const toTitle = (chatId: ChatId, phone: string | null, name: string | null) =>
  name ?? (phone === null ? chatId : formatPhone(phone))

type EnsureChatInput = {
  chatId: ChatId
  phone?: string | null
  name?: string | null
  now: number
}

/**
 * Создаёт чат или дополняет известный: номер — если его не было, имя — если пришло.
 * Название пересчитывается: имя важнее номера.
 */
export function ensureChat({ chatId, phone = null, name = null, now }: EnsureChatInput): Chat {
  const state = useChatStore.getState()
  const existing = state.byId[chatId]
  const nextPhone = existing?.phone ?? phone
  const nextName = name ?? existing?.name ?? null
  // Любое написание номера, по которому нашли этот чат, ведёт в него.
  const chatIdByPhone =
    phone === null || state.chatIdByPhone[phone] === chatId
      ? state.chatIdByPhone
      : { ...state.chatIdByPhone, [phone]: chatId }
  if (existing?.phone === nextPhone && existing.name === nextName) {
    if (chatIdByPhone !== state.chatIdByPhone) useChatStore.setState({ chatIdByPhone })
    return existing
  }
  const chat: Chat = existing
    ? { ...existing, phone: nextPhone, name: nextName, title: toTitle(chatId, nextPhone, nextName) }
    : {
        id: chatId,
        phone: nextPhone,
        name: nextName,
        title: toTitle(chatId, nextPhone, nextName),
        unreadCount: 0,
        createdAt: now,
        lastActivityAt: now,
      }
  useChatStore.setState({
    ids: existing ? state.ids : [...state.ids, chatId],
    byId: { ...state.byId, [chatId]: chat },
    chatIdByPhone,
  })
  return chat
}

type AddChatInput = {
  chatId: ChatId
  phone: string
  now: number
}

/** Чат по номеру из «Нового чата». Уже есть с таким chatId — вернёт его. */
export function addChat({ chatId, phone, now }: AddChatInput): Chat {
  return ensureChat({ chatId, phone, now })
}

export function touchChat(chatId: ChatId, at: number) {
  const chat = useChatStore.getState().byId[chatId]
  if (!chat || chat.lastActivityAt >= at) return
  useChatStore.setState((state) => ({
    byId: { ...state.byId, [chatId]: { ...chat, lastActivityAt: at } },
  }))
}

function updateUnread(chatId: ChatId, unreadCount: number) {
  const chat = useChatStore.getState().byId[chatId]
  if (!chat || chat.unreadCount === unreadCount) return
  useChatStore.setState((state) => ({
    byId: { ...state.byId, [chatId]: { ...chat, unreadCount } },
  }))
}

export function incrementUnread(chatId: ChatId) {
  const chat = useChatStore.getState().byId[chatId]
  if (chat) updateUnread(chatId, chat.unreadCount + 1)
}

export function markChatRead(chatId: ChatId) {
  updateUnread(chatId, 0)
}

export function setViewedChat(chatId: ChatId | null) {
  useChatStore.setState({ viewedChatId: chatId })
}

export function getViewedChatId() {
  return useChatStore.getState().viewedChatId
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

export function getAllChats(): Chat[] {
  const { ids, byId } = useChatStore.getState()
  return ids.map((id) => byId[id]).filter((chat) => chat !== undefined)
}

/** Восстановление истории после перезагрузки. */
export function hydrateChats(chats: readonly Chat[]) {
  const byId: Record<ChatId, Chat> = {}
  const chatIdByPhone: Record<string, ChatId> = {}
  for (const chat of chats) {
    byId[chat.id] = chat
    if (chat.phone !== null) chatIdByPhone[chat.phone] = chat.id
  }
  useChatStore.setState(
    { ...INITIAL, ids: chats.map((chat) => chat.id), byId, chatIdByPhone },
    true,
  )
}

/** Подписка на изменения чатов вне React (сохранение истории). */
export const subscribeToChats = (listener: () => void) =>
  useChatStore.subscribe((state, previous) => {
    if (state.byId !== previous.byId || state.ids !== previous.ids) listener()
  })

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

export const useTotalUnread = () =>
  useChatStore((state) =>
    state.ids.reduce((total, id) => total + (state.byId[id]?.unreadCount ?? 0), 0),
  )
