import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

import {
  closeNewChatDialog,
  DIALOG_ENTRY_STATE,
  getDialogHistoryEntry,
  isDialogEntry,
  resetNewChatDialog,
  setDialogHistoryEntry,
} from './new-chat-dialog.store'

/**
 * Форма «Новый чат» и история браузера: открытие добавляет запись, «Назад» закрывает форму,
 * закрытие из интерфейса снимает запись. Переход в созданный чат её заменяет (use-create-chat-form).
 */
export function useDialogHistory(isOpen: boolean) {
  const navigate = useNavigate()
  const location = useLocation()
  const isEntryOnTop = isDialogEntry(location.state)

  useEffect(() => {
    const entry = getDialogHistoryEntry()
    if (isOpen && !isEntryOnTop) {
      if (entry === 'own') {
        // Запись была и исчезла — пользователь нажал «Назад».
        setDialogHistoryEntry('none')
        closeNewChatDialog()
        return
      }
      setDialogHistoryEntry('own')
      void navigate(location.pathname, { state: DIALOG_ENTRY_STATE })
      return
    }
    if (isOpen) return
    if (!isEntryOnTop) {
      // Переход в чат завершился и заменил запись формы.
      if (entry === 'handedOver') setDialogHistoryEntry('none')
      return
    }
    if (entry === 'own') {
      setDialogHistoryEntry('none')
      void navigate(-1)
      return
    }
    // Чужая запись: после F5 или «Вперёд» форма закрыта, а запись осталась. Заменяем пустой, иначе
    // следующее открытие не положит свою и «Назад» перестанет закрывать форму.
    if (entry === 'none') void navigate(location.pathname, { replace: true, state: null })
  }, [isOpen, isEntryOnTop, navigate, location.pathname])

  // Страница ушла (выход, вкладка стала неактивной) при открытой форме — не открывать её снова при возврате.
  useEffect(() => resetNewChatDialog, [])
}
