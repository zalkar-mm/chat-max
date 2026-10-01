import { create } from 'zustand'

/**
 * Запись формы в истории браузера («Назад» закрывает форму):
 * - `none` — нашей записи нет;
 * - `own` — форма открыта и её запись наверху: закрытие из интерфейса снимает её «Назад»;
 * - `handedOver` — запись заменяется переходом в созданный чат, трогать её нельзя.
 */
export type DialogHistoryEntry = 'none' | 'own' | 'handedOver'

type NewChatDialogState = {
  isOpen: boolean
  historyEntry: DialogHistoryEntry
}

export const useNewChatDialogStore = create<NewChatDialogState>()(() => ({
  isOpen: false,
  historyEntry: 'none',
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

/* «Назад» браузера закрывает форму: при открытии в историю кладётся запись с этим состоянием. */
const DIALOG_ENTRY_KEY = 'newChatDialog'
export const DIALOG_ENTRY_STATE = { [DIALOG_ENTRY_KEY]: true } as const

export const isDialogEntry = (state: unknown) =>
  typeof state === 'object' && state !== null && DIALOG_ENTRY_KEY in state

export const getDialogHistoryEntry = () => useNewChatDialogStore.getState().historyEntry

export const setDialogHistoryEntry = (historyEntry: DialogHistoryEntry) => {
  useNewChatDialogStore.setState({ historyEntry })
}

/** Переход в созданный чат: true — запись формы есть, переход должен заменить её, а не добавить новую. */
export const handOverDialogHistoryEntry = () => {
  if (getDialogHistoryEntry() !== 'own') return false
  setDialogHistoryEntry('handedOver')
  return true
}

/** Сброс без навигации: страница с формой размонтирована. */
export const resetNewChatDialog = () => {
  returnFocusTarget = null
  useNewChatDialogStore.setState({ isOpen: false, historyEntry: 'none' })
}
