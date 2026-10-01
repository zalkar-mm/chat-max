import { getAllChats, hydrateChats, subscribeToChats } from '@/entities/chat/model/chat.store'
import { getAllMessages, hydrateMessages } from '@/entities/message/model/message.store'
import { subscribeToMessages } from '@/entities/message/model/subscribe-messages'
import {
  getSessionCredentials,
  subscribeToSessionChange,
  useSessionStore,
} from '@/entities/session/model/session.store'

import { readHistory, removeHistory, writeHistory } from './history-storage'

const SAVE_DEBOUNCE_MS = 300

/** История лежит там же, где креды: «Запомнить меня» — localStorage, иначе sessionStorage. */
const currentStorage = () => (useSessionStore.getState().remember ? localStorage : sessionStorage)

let saveTimer: ReturnType<typeof setTimeout> | null = null

function cancelSave() {
  if (saveTimer !== null) clearTimeout(saveTimer)
  saveTimer = null
}

function saveNow() {
  saveTimer = null
  const credentials = getSessionCredentials()
  if (!credentials) return
  writeHistory(currentStorage(), credentials.idInstance, {
    chats: getAllChats(),
    messages: getAllMessages(),
  })
}

function scheduleSave() {
  if (!getSessionCredentials()) return
  cancelSave()
  saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE_MS)
}

function loadHistory(idInstance: string) {
  const history = readHistory(currentStorage(), idInstance)
  hydrateChats(history?.chats ?? [])
  hydrateMessages(history?.messages ?? [])
}

let stopPersistence: (() => void) | null = null

/**
 * Запускается из app (идемпотентно) и только в активной вкладке — пишет историю одна вкладка.
 * Вход — загрузить историю инстанса, выход — удалить её.
 */
export function startHistoryPersistence() {
  if (stopPersistence) return stopPersistence

  const unsubscribeSession = subscribeToSessionChange((current, previous) => {
    cancelSave()
    if (previous && !current) removeHistory(previous.idInstance)
    if (current) loadHistory(current.idInstance)
  })
  const unsubscribeChats = subscribeToChats(scheduleSave)
  const unsubscribeMessages = subscribeToMessages(scheduleSave)
  const handlePageHide = () => {
    if (saveTimer !== null) saveNow()
  }
  window.addEventListener('pagehide', handlePageHide)

  // Запуск при живой сессии — вкладка снова стала активной: другая могла записать историю новее,
  // поэтому сначала читаем её, а не перезаписываем своим устаревшим состоянием.
  const credentials = getSessionCredentials()
  if (credentials) loadHistory(credentials.idInstance)

  stopPersistence = () => {
    unsubscribeSession()
    unsubscribeChats()
    unsubscribeMessages()
    window.removeEventListener('pagehide', handlePageHide)
    cancelSave()
    stopPersistence = null
  }
  return stopPersistence
}
