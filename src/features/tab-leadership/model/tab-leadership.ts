import { z } from 'zod/mini'

import {
  getSessionCredentials,
  subscribeToSessionChange,
  useSessionStore,
} from '@/entities/session/model/session.store'

import { setTabActive } from './tab-leadership.store'

export const TAB_CHANNEL_NAME = 'max-chat:tabs'

/** Сообщения между вкладками одного браузера; адресат — вкладки с той же сессией (idInstance). */
const tabMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('claim'), idInstance: z.string() }),
  z.object({
    type: z.literal('sessionEnded'),
    idInstance: z.string(),
    reason: z.enum(['signOut', 'expired']),
  }),
])

type TabMessage = z.infer<typeof tabMessageSchema>

let channel: BroadcastChannel | null = null
/** Сессия закончилась по сообщению другой вкладки — пересылать его обратно незачем. */
let isEndingFromOtherTab = false

function post(message: TabMessage) {
  channel?.postMessage(message)
}

/** «Использовать здесь» и вход: вкладка становится активной, остальные с той же сессией уходят на заглушку. */
export function claimTab() {
  const credentials = getSessionCredentials()
  if (!credentials) return
  setTabActive(true)
  post({ type: 'claim', idInstance: credentials.idInstance })
}

function handleTabMessage(event: MessageEvent<unknown>) {
  const parsed = tabMessageSchema.safeParse(event.data)
  if (!parsed.success) return
  const message = parsed.data
  if (getSessionCredentials()?.idInstance !== message.idInstance) return

  if (message.type === 'claim') {
    setTabActive(false)
    return
  }
  isEndingFromOtherTab = true
  try {
    useSessionStore.getState().endSession(message.reason)
  } finally {
    isEndingFromOtherTab = false
  }
}

let stopLeadership: (() => void) | null = null

/**
 * Запускается из app (идемпотентно). Очередь уведомлений одна на инстанс: две вкладки забирали бы события
 * по очереди, поэтому активна одна — последняя открытая или выбранная кнопкой. Без BroadcastChannel
 * вкладки не знают друг о друге и все остаются активными, как раньше.
 */
export function startTabLeadership() {
  if (stopLeadership) return stopLeadership
  if (typeof BroadcastChannel === 'undefined') return () => undefined

  const current = new BroadcastChannel(TAB_CHANNEL_NAME)
  channel = current
  current.addEventListener('message', handleTabMessage)

  const unsubscribeSession = subscribeToSessionChange((credentials, previous) => {
    if (credentials) {
      if (credentials.idInstance !== previous?.idInstance) claimTab()
      return
    }
    // Экран входа — общий для всех: после выхода вкладка снова «активна» и ничего не ждёт.
    setTabActive(true)
    if (!previous || isEndingFromOtherTab) return
    const reason = useSessionStore.getState().endReason ?? 'signOut'
    post({ type: 'sessionEnded', idInstance: previous.idInstance, reason })
  })
  if (getSessionCredentials()) claimTab()

  stopLeadership = () => {
    unsubscribeSession()
    current.removeEventListener('message', handleTabMessage)
    current.close()
    if (channel === current) channel = null
    stopLeadership = null
  }
  return stopLeadership
}
