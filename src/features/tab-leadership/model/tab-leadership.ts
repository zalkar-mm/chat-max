import { z } from 'zod/mini'

import {
  getSessionCredentials,
  subscribeToSessionChange,
  useSessionStore,
} from '@/entities/session/model/session.store'

import { getTabStatus, setTabStatus } from './tab-leadership.store'

export const TAB_CHANNEL_NAME = 'max-chat:tabs'

/** Сколько ждать, пока прежняя активная вкладка сохранит историю и уступит (она могла зависнуть или закрыться). */
export const RELEASE_TIMEOUT_MS = 300

const claimSchema = z.object({ tabId: z.string(), at: z.number() })

/** Сообщения между вкладками одного браузера; адресат — вкладки с той же сессией (idInstance). */
const tabMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('claim'), idInstance: z.string(), claim: claimSchema }),
  z.object({ type: z.literal('released'), idInstance: z.string(), to: z.string() }),
  z.object({
    type: z.literal('sessionEnded'),
    idInstance: z.string(),
    reason: z.enum(['signOut', 'expired']),
  }),
])

type TabMessage = z.infer<typeof tabMessageSchema>
type Claim = z.infer<typeof claimSchema>

export type TabLeadershipHooks = {
  /** Перед активацией: перечитать историю, которую сохранила прежняя активная вкладка. */
  beforeActivate?: () => void
  /** Перед уступкой: сохранить историю сейчас, а не по таймеру — следующая вкладка прочитает её сразу. */
  beforeDeactivate?: () => void
}

const TAB_ID = crypto.randomUUID()

let channel: BroadcastChannel | null = null
let hooks: TabLeadershipHooks = {}
/** Захват этой вкладки: пока она забирает сессию или активна. Из двух захватов побеждает более поздний. */
let ownClaim: Claim | null = null
let finishClaim: (() => void) | null = null
let releaseLock: (() => void) | null = null
/** Сессия закончилась по сообщению другой вкладки — пересылать его обратно незачем. */
let isEndingFromOtherTab = false

const lockName = (idInstance: string) => `max-chat:active:${idInstance}`

function post(message: TabMessage) {
  channel?.postMessage(message)
}

const isNewer = (a: Claim, b: Claim) => a.at > b.at || (a.at === b.at && a.tabId > b.tabId)

/** Активная вкладка держит Web Lock: по нему новая вкладка сразу видит, ждать ли ей уступки. */
function holdLock(idInstance: string) {
  if (typeof navigator.locks === 'undefined' || releaseLock) return
  void navigator.locks.request(
    lockName(idInstance),
    () =>
      new Promise<void>((resolve) => {
        releaseLock = resolve
      }),
  )
}

function dropLock() {
  releaseLock?.()
  releaseLock = null
}

async function hasActiveTab(idInstance: string) {
  if (typeof navigator.locks === 'undefined') return true
  const { held = [] } = await navigator.locks.query()
  return held.some((lock) => lock.name === lockName(idInstance))
}

function activate(idInstance: string) {
  finishClaim = null
  hooks.beforeActivate?.()
  setTabStatus('active')
  holdLock(idInstance)
}

/** Уступить сессию: активная вкладка сначала сохраняет историю, потом сообщает захватившей. */
function yieldTo(claim: Claim, idInstance: string) {
  const wasActive = getTabStatus() === 'active'
  ownClaim = null
  finishClaim = null
  if (wasActive) hooks.beforeDeactivate?.()
  dropLock()
  setTabStatus('inactive')
  if (wasActive) post({ type: 'released', idInstance, to: claim.tabId })
}

/**
 * Вход, восстановление сессии и «Использовать здесь»: вкладка забирает сессию. Если другая вкладка активна —
 * ждём, пока она сохранит историю и уступит (не дольше RELEASE_TIMEOUT_MS), и только потом начинаем работу.
 */
export function claimTab() {
  const credentials = getSessionCredentials()
  if (!credentials) return
  const { idInstance } = credentials
  if (!channel) {
    setTabStatus('active')
    return
  }

  const claim: Claim = { tabId: TAB_ID, at: Date.now() }
  ownClaim = claim
  setTabStatus('claiming')
  post({ type: 'claim', idInstance, claim })

  let isDone = false
  const done = () => {
    if (isDone) return
    isDone = true
    // Пока ждали, сессия могла закончиться или другая вкладка забрала её позже нас.
    if (ownClaim !== claim || getSessionCredentials()?.idInstance !== idInstance) return
    activate(idInstance)
  }
  setTimeout(done, RELEASE_TIMEOUT_MS)
  finishClaim = done
  void hasActiveTab(idInstance).then((isHeld) => {
    if (!isHeld) done()
  })
}

function handleTabMessage(event: MessageEvent<unknown>) {
  const parsed = tabMessageSchema.safeParse(event.data)
  if (!parsed.success) return
  const message = parsed.data
  if (getSessionCredentials()?.idInstance !== message.idInstance) return

  if (message.type === 'claim') {
    if (getTabStatus() === 'inactive') return
    // Захватили почти одновременно: уступает более ранний, более поздний напоминает о себе.
    if (ownClaim && isNewer(ownClaim, message.claim)) {
      post({ type: 'claim', idInstance: message.idInstance, claim: ownClaim })
      return
    }
    yieldTo(message.claim, message.idInstance)
    return
  }
  if (message.type === 'released') {
    if (message.to === TAB_ID) finishClaim?.()
    return
  }
  isEndingFromOtherTab = true
  try {
    useSessionStore.getState().endSession(message.reason)
  } finally {
    isEndingFromOtherTab = false
  }
}

function resetOnSessionEnd() {
  ownClaim = null
  finishClaim = null
  dropLock()
  // Экран входа — общий для всех: после выхода вкладка снова «активна» и ничего не ждёт.
  setTabStatus('active')
}

let stopLeadership: (() => void) | null = null

/**
 * Запускается из app (идемпотентно). Очередь уведомлений одна на инстанс: две вкладки забирали бы события
 * по очереди, поэтому активна одна — последняя открытая или выбранная кнопкой. Без BroadcastChannel
 * вкладки не знают друг о друге и все остаются активными, как раньше.
 */
export function startTabLeadership(nextHooks: TabLeadershipHooks = {}) {
  if (stopLeadership) return stopLeadership
  if (typeof BroadcastChannel === 'undefined') return () => undefined

  hooks = nextHooks
  const current = new BroadcastChannel(TAB_CHANNEL_NAME)
  channel = current
  current.addEventListener('message', handleTabMessage)

  const unsubscribeSession = subscribeToSessionChange((credentials, previous) => {
    if (credentials) {
      if (credentials.idInstance !== previous?.idInstance) claimTab()
      return
    }
    resetOnSessionEnd()
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
    resetOnSessionEnd()
    hooks = {}
    stopLeadership = null
  }
  return stopLeadership
}
