import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InstanceState } from '@/entities/session/model/instance-state'
import { useSessionStore } from '@/entities/session/model/session.store'

import { claimTab, startTabLeadership, TAB_CHANNEL_NAME } from './tab-leadership'
import { useTabLeadershipStore } from './tab-leadership.store'

const credentials = (idInstance: string) => ({
  idInstance,
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
})

const signIn = (idInstance = '3100000001') => {
  useSessionStore.getState().startSession({
    credentials: credentials(idInstance),
    instanceState: InstanceState.Authorized,
    remember: false,
  })
}

const isActive = () => useTabLeadershipStore.getState().isActive

/** Соседняя вкладка: свой канал и всё, что ей пришло. */
function otherTab() {
  const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
  const received: unknown[] = []
  channel.addEventListener('message', (event) => {
    received.push(event.data)
  })
  return { channel, received }
}

// Доставка между вкладками асинхронная — ждём очередь микрозадач.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('tab-leadership — одна активная вкладка на сессию', () => {
  let stop: () => void = () => undefined

  beforeEach(() => {
    stop = startTabLeadership()
  })

  afterEach(() => {
    stop()
    vi.unstubAllGlobals()
  })

  it('вход объявляет вкладку активной для соседей', async () => {
    const other = otherTab()
    signIn()
    await flush()
    expect(other.received).toEqual([{ type: 'claim', idInstance: '3100000001' }])
    expect(isActive()).toBe(true)
  })

  it('чужой захват той же сессии делает вкладку неактивной, «Использовать здесь» — снова активной', async () => {
    signIn()
    const other = otherTab()
    other.channel.postMessage({ type: 'claim', idInstance: '3100000001' })
    await flush()
    expect(isActive()).toBe(false)

    claimTab()
    await flush()
    expect(isActive()).toBe(true)
    expect(other.received).toEqual([{ type: 'claim', idInstance: '3100000001' }])
  })

  it('захват другого инстанса и мусор в канале не трогают вкладку', async () => {
    signIn()
    const other = otherTab()
    other.channel.postMessage({ type: 'claim', idInstance: '3100000002' })
    other.channel.postMessage({ type: 'unknown' })
    other.channel.postMessage('claim')
    await flush()
    expect(isActive()).toBe(true)
  })

  it('выход в этой вкладке рассылается соседям с причиной', async () => {
    signIn()
    const other = otherTab()
    useSessionStore.getState().endSession('expired')
    await flush()
    expect(other.received).toEqual([
      { type: 'sessionEnded', idInstance: '3100000001', reason: 'expired' },
    ])
  })

  it('выход в соседней вкладке завершает сессию здесь, без ответной рассылки', async () => {
    signIn()
    const other = otherTab()
    other.channel.postMessage({ type: 'claim', idInstance: '3100000001' })
    other.channel.postMessage({
      type: 'sessionEnded',
      idInstance: '3100000001',
      reason: 'signOut',
    })
    await flush()
    expect(useSessionStore.getState().credentials).toBeNull()
    expect(useSessionStore.getState().endReason).toBe('signOut')
    expect(isActive()).toBe(true)
    expect(other.received).toEqual([])
  })

  it('без BroadcastChannel вкладка всегда активна', async () => {
    stop()
    vi.stubGlobal('BroadcastChannel', undefined)
    stop = startTabLeadership()
    signIn()
    await flush()
    expect(isActive()).toBe(true)
  })
})
