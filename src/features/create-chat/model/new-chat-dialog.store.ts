import { create } from 'zustand'

type NewChatDialogState = {
  isOpen: boolean
}

export const useNewChatDialogStore = create<NewChatDialogState>()(() => ({ isOpen: false }))

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
