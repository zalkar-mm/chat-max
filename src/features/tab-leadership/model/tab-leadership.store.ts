import { create } from 'zustand'

/**
 * - `active` — вкладка получает и отправляет сообщения, пишет историю.
 * - `claiming` — вкладка забирает сессию и ждёт, пока прежняя активная сохранит историю и уступит.
 * - `inactive` — показывает заглушку и не ходит в GREEN-API.
 */
export type TabStatus = 'active' | 'claiming' | 'inactive'

type TabLeadershipState = {
  status: TabStatus
  /** Захват начат кнопкой «Использовать здесь» — заглушка показывает «Переключаем…». */
  isSwitching: boolean
}

export const useTabLeadershipStore = create<TabLeadershipState>()(() => ({
  status: 'active',
  isSwitching: false,
}))

export const useTabStatus = () => useTabLeadershipStore((state) => state.status)
export const useIsTabActive = () => useTabLeadershipStore((state) => state.status === 'active')
export const useIsTabSwitching = () => useTabLeadershipStore((state) => state.isSwitching)

export const getTabStatus = () => useTabLeadershipStore.getState().status

export function setTabStatus(status: TabStatus) {
  const isSwitching = status === 'claiming' && getTabStatus() === 'inactive'
  useTabLeadershipStore.setState({ status, isSwitching })
}
