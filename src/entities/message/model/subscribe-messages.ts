import { useMessageStore } from './message.store'

/** Подписка на изменения сообщений вне React (сохранение истории). */
export const subscribeToMessages = (listener: () => void) =>
  useMessageStore.subscribe((state, previous) => {
    if (state.byId !== previous.byId) listener()
  })
