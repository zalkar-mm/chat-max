import { useEffect } from 'react'

import { markChatRead, setViewedChat } from '@/entities/chat/model/chat.store'

/**
 * Открытый чат — «просматриваемый»: входящие в него при видимой вкладке не копят непрочитанные
 * (это учитывает слой получения). Пока вкладка скрыта, счётчик растёт; вернулись — чат снова прочитан.
 */
export function useViewedChat(chatId: string) {
  useEffect(() => {
    const markReadIfVisible = () => {
      if (document.visibilityState === 'visible') markChatRead(chatId)
    }

    setViewedChat(chatId)
    markReadIfVisible()
    document.addEventListener('visibilitychange', markReadIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', markReadIfVisible)
      setViewedChat(null)
    }
  }, [chatId])
}
