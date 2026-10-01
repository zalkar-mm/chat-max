import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InstanceState } from '@/entities/session/model/instance-state'
import { useSessionStore } from '@/entities/session/model/session.store'

import {
  claimTab,
  RELEASE_TIMEOUT_MS,
  startTabLeadership,
  TAB_CHANNEL_NAME,
  type TabLeadershipHooks,
} from './tab-leadership'
import { getTabStatus } from './tab-leadership.store'

const ID = '3100000001'
const LOCK = `max-chat:active:${ID}`

const credentials = (idInstance: string) => ({
  idInstance,
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
})

const signIn = (idInstance = ID) => {
  useSessionStore.getState().startSession({
    credentials: credentials(idInstance),
    instanceState: InstanceState.Authorized,
    remember: false,
  })
}

type ClaimMessage = { type: 'claim'; idInstance: string; claim: { tabId: string; at: number } }

const isClaim = (data: unknown): data is ClaimMessage =>
  typeof data === 'object' && data !== null && 'type' in data && data.type === 'claim'

/** Соседняя вкладка: свой канал и всё, что ей пришло. */
function otherTab() {
  const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
  const received: unknown[] = []
  channel.addEventListener('message', (event) => {
    received.push(event.data)
  })
  const claim = (at = Date.now() + 1_000, tabId = 'other') => {
    channel.postMessage({ type: 'claim', idInstance: ID, claim: { tabId, at } })
  }
  const lastClaim = () => received.filter(isClaim).at(-1)
  return { channel, received, claim, lastClaim }
}

/** Соседняя активная вкладка держит Web Lock, пока её не отпустят. */
function holdLockAsOtherTab() {
  let release: () => void = () => undefined
  void navigator.locks.request(
    LOCK,
    () =>
      new Promise<void>((resolve) => {
        release = resolve
      }),
  )
  return () => {
    release()
  }
}

// Доставка между вкладками асинхронная — ждём очередь микрозадач.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('tab-leadership — одна активная вкладка на сессию', () => {
  let stop: () => void = () => undefined
  let hooks: Required<TabLeadershipHooks>

  beforeEach(() => {
    hooks = { beforeActivate: vi.fn(), beforeDeactivate: vi.fn() }
    stop = startTabLeadership(hooks)
  })

  afterEach(() => {
    stop()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('вход без других вкладок: сразу активна, история перечитана, соседи оповещены', async () => {
    const other = otherTab()
    signIn()
    expect(getTabStatus()).toBe('claiming')
    await flush()
    expect(getTabStatus()).toBe('active')
    expect(hooks.beforeActivate).toHaveBeenCalledOnce()
    expect(other.lastClaim()?.idInstance).toBe(ID)
  })

  it('есть активная вкладка: ждём, пока она уступит («released»), и только потом работаем', async () => {
    const release = holdLockAsOtherTab()
    const other = otherTab()
    signIn()
    await flush()
    expect(getTabStatus()).toBe('claiming')

    const tabId = other.lastClaim()?.claim.tabId
    release()
    other.channel.postMessage({ type: 'released', idInstance: ID, to: tabId })
    await flush()
    expect(getTabStatus()).toBe('active')
  })

  it('активная вкладка не ответила — через RELEASE_TIMEOUT_MS работаем без неё', async () => {
    holdLockAsOtherTab()
    vi.useFakeTimers()
    signIn()
    await vi.advanceTimersByTimeAsync(RELEASE_TIMEOUT_MS - 1)
    expect(getTabStatus()).toBe('claiming')
    await vi.advanceTimersByTimeAsync(1)
    expect(getTabStatus()).toBe('active')
  })

  it('более поздний захват соседа: сохраняем историю, уступаем и сообщаем ему', async () => {
    signIn()
    await flush()
    const other = otherTab()
    other.claim()
    await flush()
    expect(hooks.beforeDeactivate).toHaveBeenCalledOnce()
    expect(getTabStatus()).toBe('inactive')
    expect(other.received).toContainEqual({ type: 'released', idInstance: ID, to: 'other' })
  })

  it('одновременный захват: уступает более ранний, более поздний напоминает о себе', async () => {
    signIn()
    await flush()
    const other = otherTab()
    other.claim(0, 'older')
    await flush()
    expect(getTabStatus()).toBe('active')
    expect(other.lastClaim()?.claim.tabId).not.toBe('older')
  })

  it('«Использовать здесь» в неактивной вкладке — снова активна, соседу уходит захват', async () => {
    signIn()
    await flush()
    const other = otherTab()
    other.claim()
    await flush()
    expect(getTabStatus()).toBe('inactive')

    claimTab()
    await flush()
    expect(getTabStatus()).toBe('active')
    expect(other.lastClaim()?.claim.at).toBeLessThanOrEqual(Date.now())
  })

  it('захват другого инстанса и мусор в канале не трогают вкладку', async () => {
    signIn()
    await flush()
    const other = otherTab()
    other.channel.postMessage({
      type: 'claim',
      idInstance: '3100000002',
      claim: { tabId: 'x', at: Date.now() + 1_000 },
    })
    other.channel.postMessage({ type: 'unknown' })
    other.channel.postMessage('claim')
    await flush()
    expect(getTabStatus()).toBe('active')
  })

  it('выход в этой вкладке рассылается соседям с причиной', async () => {
    signIn()
    await flush()
    const other = otherTab()
    useSessionStore.getState().endSession('expired')
    await flush()
    expect(other.received).toEqual([{ type: 'sessionEnded', idInstance: ID, reason: 'expired' }])
  })

  it('выход в соседней вкладке завершает сессию здесь, без ответной рассылки', async () => {
    signIn()
    await flush()
    const other = otherTab()
    other.claim()
    other.channel.postMessage({ type: 'sessionEnded', idInstance: ID, reason: 'signOut' })
    await flush()
    expect(useSessionStore.getState().credentials).toBeNull()
    expect(useSessionStore.getState().endReason).toBe('signOut')
    expect(getTabStatus()).toBe('active')
    expect(other.received.filter((message) => !isClaim(message))).toEqual([
      { type: 'released', idInstance: ID, to: 'other' },
    ])
  })

  it('без BroadcastChannel вкладка всегда активна', async () => {
    stop()
    vi.stubGlobal('BroadcastChannel', undefined)
    stop = startTabLeadership()
    signIn()
    await flush()
    expect(getTabStatus()).toBe('active')
  })
})
