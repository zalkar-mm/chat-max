import { create } from 'zustand'

type NewChatDialogState = {
  isOpen: boolean
  /** Наша запись наверху истории браузера, которую при закрытии из интерфейса нужно снять. */
  hasHistoryEntry: boolean
}

export const useNewChatDialogStore = create<NewChatDialogState>()(() => ({
  isOpen: false,
  hasHistoryEntry: false,
}))

// Кнопка-инициатор: после закрытия фокус возвращается на неё (кнопок открытия две).
let returnFocusTarget: HTMLElement | null = null

export const openNewChatDialog = () => {
  returnFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null
  useNewChatDialogStore.setState({ isOpen: true })
}

export const closeNewChatDialog = () => {
  useNewChatDialogStore.setState({ isOpen: false })
}

/** Закрытие после создания чата: фокус уйдёт в открытый чат, возвращать его на кнопку не нужно. */
export const closeNewChatDialogWithoutFocusReturn = () => {
  returnFocusTarget = null
  closeNewChatDialog()
}

export const takeReturnFocusTarget = () => {
  const target = returnFocusTarget
  returnFocusTarget = null
  return target
}

/* «Назад» браузера закрывает форму (DS §1): при открытии в историю кладётся запись с этим состоянием. */
const DIALOG_ENTRY_KEY = 'newChatDialog'
export const DIALOG_ENTRY_STATE = { [DIALOG_ENTRY_KEY]: true } as const

export const isDialogEntry = (state: unknown) =>
  typeof state === 'object' && state !== null && DIALOG_ENTRY_KEY in state

export const markDialogHistoryEntry = () => {
  useNewChatDialogStore.setState({ hasHistoryEntry: true })
}

/** Забрать запись: true — она есть и теперь наша забота (снять «Назад» или заменить переходом). */
export const takeDialogHistoryEntry = () => {
  const had = useNewChatDialogStore.getState().hasHistoryEntry
  useNewChatDialogStore.setState({ hasHistoryEntry: false })
  return had
}

export const hasDialogHistoryEntry = () => useNewChatDialogStore.getState().hasHistoryEntry
