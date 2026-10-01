import { create } from 'zustand'

type TabLeadershipState = {
  /** Эта вкладка получает и отправляет сообщения. Неактивная показывает заглушку и не ходит в GREEN-API. */
  isActive: boolean
}

export const useTabLeadershipStore = create<TabLeadershipState>()(() => ({ isActive: true }))

export const useIsTabActive = () => useTabLeadershipStore((state) => state.isActive)

export function setTabActive(isActive: boolean) {
  if (useTabLeadershipStore.getState().isActive === isActive) return
  useTabLeadershipStore.setState({ isActive })
}
