import { describe, expect, it } from 'vitest'

import type { Chat } from '@/entities/chat/model/chat.types'
import type { Message } from '@/entities/message/model/message.types'

import { type History, MAX_MESSAGES_PER_CHAT, readHistory, writeHistory } from './history-storage'

const ID = '1100000001'
const KEY = `max-chat:history:${ID}`

const chat: Chat = {
  id: '191234567',
  phone: '79991234567',
  name: null,
  title: '+7 999 123-45-67',
  unreadCount: 0,
  createdAt: 1,
  lastActivityAt: 1,
}

const incoming = (index: number): Message => ({
  id: `m-${index}`,
  idMessage: `in-${index}`,
  chatId: chat.id,
  text: `сообщение ${index}`,
  content: 'text',
  createdAt: index,
  direction: 'incoming',
})

const historyOf = (count: number): History => ({
  chats: [chat],
  messages: Array.from({ length: count }, (_, index) => incoming(index)),
})

/** Хранилище с квотой: setItem длиннее `limit` символов падает, как QuotaExceededError в браузере. */
function createStorage(limit = Infinity): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get length() {
      return data.size
    },
    clear: () => {
      data.clear()
    },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      if (value.length > limit) throw new DOMException('quota', 'QuotaExceededError')
      data.set(key, value)
    },
  }
}

const savedCount = (storage: Storage) => readHistory(storage, ID)?.messages.length ?? null

describe('history-storage', () => {
  it('записанная история читается обратно без потерь', () => {
    const storage = createStorage()
    const history = historyOf(3)
    writeHistory(storage, ID, history)
    expect(readHistory(storage, ID)).toEqual(history)
  })

  it(`хранит последние ${MAX_MESSAGES_PER_CHAT} сообщений чата, старые отбрасывает`, () => {
    const storage = createStorage()
    writeHistory(storage, ID, historyOf(MAX_MESSAGES_PER_CHAT + 20))
    const messages = readHistory(storage, ID)?.messages ?? []
    expect(messages).toHaveLength(MAX_MESSAGES_PER_CHAT)
    expect(messages[0]?.id).toBe('m-20')
  })

  it('нет места под полную историю → сохраняются последние 100 сообщений', () => {
    const full = JSON.stringify({ version: 1, ...historyOf(150) }).length
    const storage = createStorage(full - 1)
    writeHistory(storage, ID, historyOf(150))
    expect(savedCount(storage)).toBe(100)
  })

  it('не влезает и сокращённая → старый снимок удаляется, чтобы не показать устаревшую историю', () => {
    const storage = createStorage()
    writeHistory(storage, ID, historyOf(2))
    const tiny = createStorage(10)
    tiny.data.set(KEY, storage.getItem(KEY) ?? '')

    writeHistory(tiny, ID, historyOf(5))

    expect(tiny.getItem(KEY)).toBeNull()
    expect(readHistory(tiny, ID)).toBeNull()
  })

  it.each([
    ['битый JSON', '{'],
    ['чужая версия формата', JSON.stringify({ version: 99, chats: [], messages: [] })],
    ['неверная форма', JSON.stringify({ version: 1, chats: 'нет', messages: [] })],
  ])('%s → null (начинаем с пустой истории)', (_, raw) => {
    const storage = createStorage()
    storage.setItem(KEY, raw)
    expect(readHistory(storage, ID)).toBeNull()
  })

  it('хранилище недоступно → чтение даёт null, запись не бросает', () => {
    const deny = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    const broken = createStorage()
    broken.getItem = deny
    broken.setItem = deny
    broken.removeItem = deny
    expect(readHistory(broken, ID)).toBeNull()
    expect(() => {
      writeHistory(broken, ID, historyOf(1))
    }).not.toThrow()
  })
})
