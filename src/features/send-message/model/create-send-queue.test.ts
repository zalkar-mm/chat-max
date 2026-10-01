import { describe, expect, it, vi } from 'vitest'

import { ApiError, ApiErrorKind } from '@/shared/api/api-error'

import { createSendQueue, type SendQueueDeps } from './create-send-queue'

const credentials = { idInstance: '1', apiTokenInstance: 't', apiUrl: 'https://x' }

type Deferred = {
  resolve: (id: string) => void
  reject: (error: unknown) => void
  signal: AbortSignal
}

const setup = (overrides: Partial<SendQueueDeps> = {}) => {
  const calls: { text: string; deferred: Deferred }[] = []
  const deps: SendQueueDeps = {
    getCredentials: () => credentials,
    getPendingMessage: (id) => ({ chatId: 'chat', text: id }),
    send: (_credentials, _chatId, text, signal) =>
      new Promise<string>((resolve, reject) => {
        calls.push({ text, deferred: { resolve, reject, signal } })
      }),
    onSent: vi.fn(),
    onFailed: vi.fn(),
    ...overrides,
  }
  const queue = createSendQueue(deps, () => 'failed')
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
  return { queue, deps, calls, flush }
}

describe('createSendQueue', () => {
  it('отправляет по одному в порядке постановки', async () => {
    const { queue, calls, deps, flush } = setup()
    queue.enqueue('a')
    queue.enqueue('b')
    queue.enqueue('c')
    expect(calls.map((call) => call.text)).toEqual(['a'])

    calls[0]?.deferred.resolve('id-a')
    await flush()
    expect(calls.map((call) => call.text)).toEqual(['a', 'b'])
    calls[1]?.deferred.resolve('id-b')
    await flush()
    calls[2]?.deferred.resolve('id-c')
    await flush()
    expect(deps.onSent).toHaveBeenNthCalledWith(3, 'c', 'id-c')
  })

  it('ошибка одного сообщения не останавливает очередь', async () => {
    const { queue, calls, deps, flush } = setup()
    queue.enqueue('a')
    queue.enqueue('b')
    calls[0]?.deferred.reject(new ApiError(ApiErrorKind.Server, 500))
    await flush()
    expect(deps.onFailed).toHaveBeenCalledWith('a', 'failed', ApiErrorKind.Server)
    expect(calls.map((call) => call.text)).toEqual(['a', 'b'])
  })

  it('reset обрывает запрос в полёте; оборванное не помечается ни отправленным, ни ошибкой', async () => {
    const { queue, calls, deps, flush } = setup()
    queue.enqueue('a')
    queue.enqueue('b')
    queue.reset()
    expect(calls[0]?.deferred.signal.aborted).toBe(true)

    calls[0]?.deferred.resolve('late')
    await flush()
    expect(deps.onSent).not.toHaveBeenCalled()
    expect(deps.onFailed).not.toHaveBeenCalled()
    expect(calls).toHaveLength(1)
  })

  it('после reset очередь снова работает (повторный вход)', async () => {
    const { queue, calls, deps, flush } = setup()
    queue.enqueue('a')
    queue.reset()
    queue.enqueue('b')
    expect(calls.map((call) => call.text)).toEqual(['a', 'b'])

    calls[0]?.deferred.resolve('late')
    calls[1]?.deferred.resolve('id-b')
    await flush()
    expect(deps.onSent).toHaveBeenCalledTimes(1)
    expect(deps.onSent).toHaveBeenCalledWith('b', 'id-b')
  })

  it('одно и то же сообщение не ставится в очередь дважды', () => {
    const { queue, calls } = setup()
    queue.enqueue('a')
    queue.enqueue('a')
    queue.enqueue('b')
    queue.enqueue('b')
    expect(calls).toHaveLength(1)
  })

  it('нет сессии → сообщение помечается ошибкой, а не висит «отправляется»', async () => {
    const { queue, deps, flush } = setup({ getCredentials: () => null })
    queue.enqueue('a')
    await flush()
    expect(deps.onFailed).toHaveBeenCalledWith('a', null, ApiErrorKind.Unknown)
  })
})
