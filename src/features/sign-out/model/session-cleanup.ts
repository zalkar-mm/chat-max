import { clearChats } from '@/entities/chat/model/chat.store'
import { clearMessages } from '@/entities/message/model/message.store'
import { subscribeToSessionChange } from '@/entities/session/model/session.store'

let stopCleanup: (() => void) | null = null

/**
 * Конец сессии по любой причине (кнопка «Выйти», недействительные креды) — данные приложения очищаются.
 * Запускается из app (идемпотентно), чтобы не повторять очистку в каждом месте выхода.
 */
export function startSessionCleanup() {
  if (stopCleanup) return stopCleanup
  const unsubscribe = subscribeToSessionChange((current, previous) => {
    if (previous && !current) {
      clearMessages()
      clearChats()
    }
  })
  stopCleanup = () => {
    unsubscribe()
    stopCleanup = null
  }
  return stopCleanup
}
