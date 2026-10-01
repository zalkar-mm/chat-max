import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/node'
import { renderApp } from '@/test/render-app'

const STORAGE_KEY = 'max-chat:session'
const TOKEN = 'secret-token-123'

const storeSession = (idInstance: string) => {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      idInstance,
      apiTokenInstance: TOKEN,
      apiUrl: 'https://3100.api.green-api.com',
    }),
  )
}

const respondWithStates = (...states: string[]) => {
  const queue = [...states]
  server.use(
    http.get('*/waInstance:id/getStateInstance/:token', () =>
      HttpResponse.json({ stateInstance: queue.shift() ?? states.at(-1) }),
    ),
  )
}

describe('Вход — пограничные случаи', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('восстановление сессии со статусом starting → автоперепроверка и вход (StrictMode)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    storeSession('3100000001')
    // StrictMode монтирует гейт дважды: первый запрос восстановления отменяется, но ответ уже съеден.
    respondWithStates('starting', 'starting', 'starting', 'authorized')
    await renderApp()

    expect(await screen.findByRole('heading', { name: 'Инстанс запускается' })).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(await screen.findByText('Попытка 1 из 30')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('токен сменили во время автоперепроверки → форма с ошибкой кредов', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    storeSession('3100000001')
    respondWithStates('starting')
    await renderApp()
    await screen.findByRole('heading', { name: 'Инстанс запускается' })

    server.use(
      http.get(
        '*/waInstance:id/getStateInstance/:token',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный idInstance или apiTokenInstance',
    )
  })

  it('ошибка «Проверить снова» показывается на экране статуса, контекст не теряется', async () => {
    storeSession('3100000003')
    const { user } = await renderApp()
    await screen.findByRole('heading', { name: 'Инстанс не подключён к MAX' })

    server.use(
      http.get(
        '*/waInstance:id/getStateInstance/:token',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Проверить снова' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервис GREEN-API недоступен. Попробуйте позже',
    )
    expect(screen.getByRole('heading', { name: 'Инстанс не подключён к MAX' })).toBeInTheDocument()
  })

  it('5xx на входе → «Сервис GREEN-API недоступен»', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(screen.getByLabelText('idInstance'), '3100000050')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервис GREEN-API недоступен. Попробуйте позже',
    )
  })

  it('5xx при старте → экран «Нет соединения» с текстом ошибки, данные не удалены', async () => {
    storeSession('3100000050')
    await renderApp()
    expect(await screen.findByRole('heading', { name: 'Нет соединения' })).toBeInTheDocument()
    expect(screen.getByText('Сервис GREEN-API недоступен. Попробуйте позже')).toBeInTheDocument()
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('на desktop фокус сразу в поле idInstance', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }))
    await renderApp({ path: '/sign-in' })
    expect(await screen.findByLabelText('idInstance')).toHaveFocus()
  })

  it('на mobile фокус в поле не ставится', async () => {
    await renderApp({ path: '/sign-in' })
    expect(await screen.findByLabelText('idInstance')).not.toHaveFocus()
  })

  it('сплэш появляется только после 300 мс проверки', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    storeSession('3100000001')
    server.use(
      http.get(
        '*/waInstance:id/getStateInstance/:token',
        () => new Promise<Response>(() => undefined),
      ),
    )
    await renderApp()
    expect(screen.queryByRole('status', { name: 'Загрузка' })).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
  })

  it('токена нет ни в консоли, ни в тексте страницы при ошибках', async () => {
    const calls: unknown[] = []
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        calls.push(...args)
      })
    }
    storeSession('3100000050')
    await renderApp()
    await screen.findByRole('heading', { name: 'Нет соединения' })

    expect(document.body.innerHTML).not.toContain(TOKEN)
    expect(JSON.stringify(calls.map(String))).not.toContain(TOKEN)
  })
})
