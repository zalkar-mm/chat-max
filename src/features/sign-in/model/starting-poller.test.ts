import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InstanceState } from '@/entities/session/model/instance-state'

import { createStartingPoller } from './starting-poller'

const setup = (check: (signal: AbortSignal) => Promise<InstanceState>) => {
  const onAttempt = vi.fn()
  const onResolved = vi.fn()
  const onGiveUp = vi.fn()
  const poller = createStartingPoller({
    check,
    onAttempt,
    onResolved,
    onGiveUp,
    intervalMs: 10_000,
    maxAttempts: 30,
  })
  return { poller, onAttempt, onResolved, onGiveUp }
}

describe('createStartingPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('перепроверяет каждые 10 с и сообщает о выходе из starting', async () => {
    const check = vi
      .fn<() => Promise<InstanceState>>()
      .mockResolvedValueOnce(InstanceState.Starting)
      .mockResolvedValueOnce(InstanceState.Authorized)
    const { poller, onResolved, onAttempt } = setup(check)

    poller.start()
    await vi.advanceTimersByTimeAsync(9_999)
    expect(check).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(check).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(check).toHaveBeenCalledTimes(2)
    expect(onAttempt).toHaveBeenLastCalledWith(2)
    expect(onResolved).toHaveBeenCalledWith(InstanceState.Authorized)
  })

  it('после 30 попыток сдаётся и останавливается', async () => {
    const check = vi.fn(() => Promise.resolve(InstanceState.Starting))
    const { poller, onGiveUp } = setup(check)

    poller.start()
    await vi.advanceTimersByTimeAsync(10_000 * 30)
    expect(onGiveUp).toHaveBeenCalledTimes(1)
    expect(check).toHaveBeenCalledTimes(30)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(check).toHaveBeenCalledTimes(30)
  })

  it('stop отменяет следующую проверку и запрос в полёте', async () => {
    let signal: AbortSignal | null = null
    const check = vi.fn((abortSignal: AbortSignal) => {
      signal = abortSignal
      return new Promise<InstanceState>(() => undefined)
    })
    const { poller, onResolved } = setup(check)

    poller.start()
    await vi.advanceTimersByTimeAsync(10_000)
    poller.stop()

    expect(signal).toMatchObject({ aborted: true })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(check).toHaveBeenCalledTimes(1)
    expect(onResolved).not.toHaveBeenCalled()
  })

  it('ошибка сети — неудачная попытка, опрос продолжается', async () => {
    const check = vi
      .fn<() => Promise<InstanceState>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(InstanceState.Authorized)
    const { poller, onResolved } = setup(check)

    poller.start()
    await vi.advanceTimersByTimeAsync(20_000)
    expect(onResolved).toHaveBeenCalledWith(InstanceState.Authorized)
  })

  it('повторный start без stop не запускает второй опрос', async () => {
    const check = vi.fn(() => Promise.resolve(InstanceState.Starting))
    const { poller } = setup(check)

    poller.start()
    poller.start()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(check).toHaveBeenCalledTimes(1)
    poller.stop()
  })
})
