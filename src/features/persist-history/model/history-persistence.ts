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
  // Вызов не по таймеру (уход вкладки, pagehide) отменяет отложенную запись: иначе она позже перезапишет
  // историю устаревшим состоянием — уже после того, как сессию забрала другая вкладка.
  cancelSave()
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

/** Вкладка становится активной: перечитать историю, которую записала прежняя активная вкладка. */
export function reloadHistory() {
  const credentials = getSessionCredentials()
  if (credentials) loadHistory(credentials.idInstance)
}

/** Вкладка уступает сессию: несохранённое пишется сразу, следующая вкладка прочитает его. */
export function flushHistory() {
  if (saveTimer !== null) saveNow()
}

let stopCleanup: (() => void) | null = null

/**
 * Удаление истории при выходе — в любой вкладке, и в неактивной тоже: выход с заглушки, когда
 * активную уже закрыли, иначе оставил бы переписку в хранилище. Запускается из app (идемпотентно).
 */
export function startHistoryCleanup() {
  if (stopCleanup) return stopCleanup
  const unsubscribe = subscribeToSessionChange((current, previous) => {
    if (previous && !current) {
      cancelSave()
      removeHistory(previous.idInstance)
    }
  })
  stopCleanup = () => {
    unsubscribe()
    stopCleanup = null
  }
  return stopCleanup
}

let stopPersistence: (() => void) | null = null

/**
 * Запускается из app (идемпотентно) и только в активной вкладке — пишет историю одна вкладка.
 * Вход — загрузить историю инстанса; удаление при выходе — `startHistoryCleanup`.
 */
export function startHistoryPersistence() {
  if (stopPersistence) return stopPersistence

  const unsubscribeSession = subscribeToSessionChange((current) => {
    cancelSave()
    if (current) loadHistory(current.idInstance)
  })
  const unsubscribeChats = subscribeToChats(scheduleSave)
  const unsubscribeMessages = subscribeToMessages(scheduleSave)
  const handlePageHide = flushHistory
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
    // Остановка — уход вкладки в неактивные или размонтирование: несохранённое не теряем.
    flushHistory()
    stopPersistence = null
  }
  return stopPersistence
}
