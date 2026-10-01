import { useNavigate } from 'react-router'

import { useQueryClient } from '@tanstack/react-query'

import { clearChats } from '@/entities/chat/model/chat.store'
import { clearMessages } from '@/entities/message/model/message.store'
import { useSessionStore } from '@/entities/session/model/session.store'

import { ROUTES } from '@/shared/consts/routes'

/** Полный выход: запросы, креды в обоих хранилищах, данные приложения — и экран входа. */
export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return () => {
    void queryClient.cancelQueries()
    // Сначала конец сессии — он останавливает фоновые процессы (очередь отправки), потом данные.
    useSessionStore.getState().endSession()
    queryClient.clear()
    clearMessages()
    clearChats()
    void navigate(ROUTES.SIGN_IN, { replace: true })
  }
}
