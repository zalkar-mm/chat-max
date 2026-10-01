import { useNavigate } from 'react-router'

import { useQueryClient } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/session/model/session.store'

import { ROUTES } from '@/shared/consts/routes'

/**
 * Выход: конец сессии останавливает фоновые процессы и чистит данные (сервисы из app подписаны на него),
 * здесь — кэш запросов и экран входа.
 */
export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return () => {
    useSessionStore.getState().endSession('signOut')
    void queryClient.cancelQueries()
    queryClient.clear()
    void navigate(ROUTES.SIGN_IN, { replace: true })
  }
}
