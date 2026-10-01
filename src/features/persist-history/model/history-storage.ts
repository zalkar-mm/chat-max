import { z } from 'zod/mini'

import type { Chat } from '@/entities/chat/model/chat.types'
import type { Message } from '@/entities/message/model/message.types'

/** Последние сообщения на чат, которые переживают перезагрузку. */
export const MAX_MESSAGES_PER_CHAT = 500

const STORAGE_PREFIX = 'max-chat:history:'
const VERSION = 1

const chatSchema = z.object({
  id: z.string(),
  phone: z.nullable(z.string()),
  name: z.nullable(z.string()),
  title: z.string(),
  unreadCount: z.int().check(z.nonnegative()),
  createdAt: z.number(),
  lastActivityAt: z.number(),
})

const base = {
  id: z.string(),
  chatId: z.string(),
  text: z.string(),
  content: z.enum(['text', 'unsupported']),
  createdAt: z.number(),
}

const failureSchema = z.enum([
  'offline',
  'suspended',
  'quotaExceeded',
  'rejected',
  'failed',
  'undelivered',
])

const messageSchema = z.discriminatedUnion('direction', [
  z.object({ ...base, direction: z.literal('incoming'), idMessage: z.string() }),
  z.object({
    ...base,
    direction: z.literal('outgoing'),
    delivery: z.discriminatedUnion('status', [
      z.object({ status: z.literal('sending') }),
      z.object({ status: z.enum(['sent', 'delivered', 'read']), idMessage: z.string() }),
      z.object({ status: z.literal('failed'), failure: failureSchema }),
    ]),
  }),
])

const historySchema = z.object({
  version: z.literal(VERSION),
  chats: z.array(chatSchema),
  messages: z.array(messageSchema),
})

export type History = {
  chats: Chat[]
  messages: Message[]
}

const keyFor = (idInstance: string) => `${STORAGE_PREFIX}${idInstance}`

/** История инстанса или null: нет данных, они битые или хранилище недоступно — начинаем с пустой. */
export function readHistory(storage: Storage, idInstance: string): History | null {
  try {
    const raw = storage.getItem(keyFor(idInstance))
    if (raw === null) return null
    const parsed = historySchema.safeParse(JSON.parse(raw))
    return parsed.success ? { chats: parsed.data.chats, messages: parsed.data.messages } : null
  } catch {
    return null
  }
}

function trimMessages(messages: readonly Message[], perChat: number) {
  const byChat = new Map<string, Message[]>()
  for (const message of messages) {
    const list = byChat.get(message.chatId) ?? []
    list.push(message)
    byChat.set(message.chatId, list)
  }
  return [...byChat.values()].flatMap((list) =>
    list.toSorted((left, right) => left.createdAt - right.createdAt).slice(-perChat),
  )
}

/** Запасной лимит, если полная история не влезла в хранилище. */
const FALLBACK_MESSAGES_PER_CHAT = 100

function trySave(storage: Storage, idInstance: string, history: History, perChat: number) {
  try {
    const payload = {
      version: VERSION,
      chats: history.chats,
      messages: trimMessages(history.messages, perChat),
    }
    storage.setItem(keyFor(idInstance), JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

/**
 * Сохранение не роняет приложение. Нет места — пробуем короче; не вышло и так — удаляем старый снимок,
 * чтобы после F5 не показать устаревшую историю вместо свежей.
 */
export function writeHistory(storage: Storage, idInstance: string, history: History) {
  if (trySave(storage, idInstance, history, MAX_MESSAGES_PER_CHAT)) return
  if (trySave(storage, idInstance, history, FALLBACK_MESSAGES_PER_CHAT)) return
  try {
    storage.removeItem(keyFor(idInstance))
  } catch {
    // Хранилище недоступно целиком — история живёт до перезагрузки.
  }
}

export function removeHistory(idInstance: string) {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.removeItem(keyFor(idInstance))
    } catch {
      // Хранилище недоступно — удалять нечего.
    }
  }
}
