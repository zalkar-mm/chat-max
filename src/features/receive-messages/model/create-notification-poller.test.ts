import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RawNotification } from '@/entities/notification/model/notification.types'

import { ApiError, ApiErrorKind } from '@/shared/api/api-error'

import { createNotificationPoller, type NotificationPollerDeps } from './create-notification-poller'

type Script = (RawNotification | null | ApiError)[]

const notification = (receiptId: number): RawNotification => ({ receiptId, body: { receiptId } })

const setup = (script: Script, overrides: Partial<NotificationPollerDeps> = {}) => {
  let inFlight = 0
  let maxInFlight = 0
  const receive = vi.fn(async (signal: AbortSignal) => {
    inFlight += 1
    maxInFlight = Math.max(maxInFlight, inFlight)
    try {
      const next = script.shift()
      if (next instanceof ApiError) throw next
      if (next !== undefined) return next
      // Очередь пуста — «висим» в long-poll, пока не отменят.
      return await new Promise<null>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new ApiError(ApiErrorKind.Aborted))
        })
      })
    } finally {
      inFlight -= 1
    }
  })
  const deps: NotificationPollerDeps = {
    receive,
    remove: vi.fn(() => Promise.resolve(true)),
    handle: vi.fn(),
    onFailure: vi.fn(),
    onRecovered: vi.fn(),
    onUnauthorized: vi.fn(),
    ...overrides,
  }
  const poller = createNotificationPoller(deps)
  return { poller, deps, receive, maxInFlight: () => maxInFlight }
}

describe('createNotificationPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('обрабатывает и удаляет каждое событие по порядку, один receive за раз', async () => {
    const { poller, deps, maxInFlight } = setup([notification(1), null, notification(2)])
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(deps.handle).mock.calls.map(([n]) => n.receiptId)).toEqual([1, 2])
    expect(vi.mocked(deps.remove).mock.calls.map(([id]) => id)).toEqual([1, 2])
    expect(maxInFlight()).toBe(1)
    poller.stop()
  })

  it('ошибка обработчика не мешает удалению и следующему событию', async () => {
    const handle = vi.fn((n: RawNotification) => {
      if (n.receiptId === 1) throw new Error('битое событие')
    })
    const { poller, deps } = setup([notification(1), notification(2)], { handle })
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(deps.remove).mock.calls.map(([id]) => id)).toEqual([1, 2])
    poller.stop()
  })

  it('сбои сервера — паузы 1, 2, 4 с; успех сбрасывает счётчик', async () => {
    const server = () => new ApiError(ApiErrorKind.Server, 500)
    const { poller, deps, receive } = setup([server(), server(), server(), null])
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(deps.onFailure).toHaveBeenLastCalledWith({
      failures: 1,
      retryInMs: 1_000,
      kind: 'server',
    })
    await vi.advanceTimersByTimeAsync(1_000)
    expect(deps.onFailure).toHaveBeenLastCalledWith({
      failures: 2,
      retryInMs: 2_000,
      kind: 'server',
    })
    await vi.advanceTimersByTimeAsync(2_000)
    expect(deps.onFailure).toHaveBeenLastCalledWith({
      failures: 3,
      retryInMs: 4_000,
      kind: 'server',
    })
    expect(receive).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(4_000)
    expect(deps.onRecovered).toHaveBeenCalledTimes(1)
    poller.stop()
  })

  it('wake прерывает паузу после сбоя (сеть вернулась)', async () => {
    const { poller, receive } = setup([new ApiError(ApiErrorKind.Offline)])
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(receive).toHaveBeenCalledTimes(1)
    poller.wake()
    await vi.advanceTimersByTimeAsync(0)
    expect(receive).toHaveBeenCalledTimes(2)
    poller.stop()
  })

  it('удаление не прошло — ещё 3 попытки, затем цикл продолжается', async () => {
    const remove = vi.fn((_receiptId: number, _signal: AbortSignal) =>
      Promise.reject(new ApiError(ApiErrorKind.Server, 500)),
    )
    const { poller, deps } = setup([notification(1), notification(2)], { remove })
    poller.start()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(remove.mock.calls.filter(([id]) => id === 1)).toHaveLength(4)
    expect(vi.mocked(deps.handle).mock.calls.map(([n]) => n.receiptId)).toEqual([1, 2])
    poller.stop()
  })

  it('401 — цикл останавливается и сообщает о недействительной сессии', async () => {
    const { poller, deps, receive } = setup([new ApiError(ApiErrorKind.Unauthorized, 401)])
    poller.start()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(deps.onUnauthorized).toHaveBeenCalledTimes(1)
    expect(receive).toHaveBeenCalledTimes(1)
    expect(poller.isRunning()).toBe(false)
  })

  it('мягкая пауза дообрабатывает текущее событие и удаляет его', async () => {
    let poller: ReturnType<typeof createNotificationPoller> | null = null
    const handle = vi.fn(() => {
      poller?.pause()
    })
    const setupResult = setup([notification(7), notification(8)], { handle })
    poller = setupResult.poller
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(setupResult.deps.remove).toHaveBeenCalledWith(7, expect.any(AbortSignal))
    expect(handle).toHaveBeenCalledTimes(1)
  })

  it('stop обрывает висящий long-poll; повторный start не создаёт второй цикл', async () => {
    const { poller, receive, maxInFlight } = setup([])
    poller.start()
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(receive).toHaveBeenCalledTimes(1)
    poller.stop()
    await vi.advanceTimersByTimeAsync(0)
    expect(receive.mock.calls[0]?.[0].aborted).toBe(true)
    expect(maxInFlight()).toBe(1)
  })
})
