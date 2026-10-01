import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

import {
  closeNewChatDialog,
  DIALOG_ENTRY_STATE,
  hasDialogHistoryEntry,
  isDialogEntry,
  markDialogHistoryEntry,
  takeDialogHistoryEntry,
} from './new-chat-dialog.store'

/**
 * Форма «Новый чат» и история браузера: открытие добавляет запись, «Назад» закрывает форму,
 * закрытие из интерфейса снимает запись. Переход в созданный чат заменяет её (use-create-chat-form).
 */
export function useDialogHistory(isOpen: boolean) {
  const navigate = useNavigate()
  const location = useLocation()
  const isEntryOnTop = isDialogEntry(location.state)

  useEffect(() => {
    if (isOpen && !isEntryOnTop) {
      if (hasDialogHistoryEntry()) {
        // Запись была и исчезла — пользователь нажал «Назад».
        takeDialogHistoryEntry()
        closeNewChatDialog()
        return
      }
      markDialogHistoryEntry()
      void navigate(location.pathname, { state: DIALOG_ENTRY_STATE })
      return
    }
    if (!isOpen && isEntryOnTop && takeDialogHistoryEntry()) void navigate(-1)
  }, [isOpen, isEntryOnTop, navigate, location.pathname])
}
