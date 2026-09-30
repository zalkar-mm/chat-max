import { create } from 'zustand'

type NewChatDialogState = {
  isOpen: boolean
}

export const useNewChatDialogStore = create<NewChatDialogState>()(() => ({ isOpen: false }))

export const openNewChatDialog = () => {
  useNewChatDialogStore.setState({ isOpen: true })
}

export const setNewChatDialogOpen = (isOpen: boolean) => {
  useNewChatDialogStore.setState({ isOpen })
}
