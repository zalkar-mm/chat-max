import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session/model/session.store'

import { server } from '@/mocks/node'
import { renderApp } from '@/test/render-app'

const STORAGE_KEY = 'max-chat:session'

const signIn = async (idInstance: string, token = 'token') => {
  const view = await renderApp({ path: '/sign-in' })
  await view.user.type(screen.getByLabelText('idInstance'), idInstance)
  await view.user.type(screen.getByLabelText('apiTokenInstance'), token)
  await view.user.click(screen.getByRole('button', { name: 'Войти' }))
  return view
}

const respondWithStates = (...states: string[]) => {
  const queue = [...states]
  server.use(
    http.get('*/waInstance:id/getStateInstance/:token', () =>
      HttpResponse.json({ stateInstance: queue.shift() ?? states.at(-1) }),
    ),
  )
}

describe('Статус инстанса при входе', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('authorized → главный экран', async () => {
    await signIn('3100000001')
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('suspended → главный экран, статус сохранён в сессии', async () => {
    await signIn('3100000002')
    await screen.findByRole('heading', { name: 'Чаты' })
    expect(useSessionStore.getState().instanceState).toBe('suspended')
  })

  it('notAuthorized → инструкция; «Проверить снова» делает новый запрос; креды не сохранены', async () => {
    const { user } = await signIn('3100000003')
    expect(
      await screen.findByRole('heading', { name: 'Инстанс не подключён к MAX' }),
    ).toBeInTheDocument()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    respondWithStates('authorized')
    await user.click(screen.getByRole('button', { name: 'Проверить снова' }))
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('«Изменить данные» возвращает к форме с введёнными значениями', async () => {
    const { user } = await signIn('3100000005')
    expect(
      await screen.findByRole('heading', { name: 'Аккаунт MAX заблокирован' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Изменить данные' }))
    expect(screen.getByLabelText('idInstance')).toHaveValue('3100000005')
    expect(screen.getByLabelText('apiTokenInstance')).toHaveValue('token')
  })

  it('pendingPassword → свой экран', async () => {
    await signIn('3100000006')
    expect(
      await screen.findByRole('heading', { name: 'Нужен пароль двухфакторной защиты' }),
    ).toBeInTheDocument()
  })

  it('starting → автоперепроверка каждые 10 с и автоматический вход', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    respondWithStates('starting', 'starting', 'authorized')
    await signIn('3100000001')
    expect(await screen.findByRole('heading', { name: 'Инстанс запускается' })).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(await screen.findByText('Попытка 1 из 30')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('после 30 неудачных перепроверок — текст про перезапуск, опрос остановлен', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let requests = 0
    server.use(
      http.get('*/waInstance:id/getStateInstance/:token', () => {
        requests += 1
        return HttpResponse.json({ stateInstance: 'starting' })
      }),
    )
    await signIn('3100000001')
    await screen.findByRole('heading', { name: 'Инстанс запускается' })

    await act(() => vi.advanceTimersByTimeAsync(10_000 * 30))
    expect(
      await screen.findByRole('heading', { name: 'Инстанс долго не запускается' }),
    ).toBeInTheDocument()
    const afterGiveUp = requests
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(requests).toBe(afterGiveUp)
  })

  it('«Отмена» останавливает автопроверку', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let requests = 0
    server.use(
      http.get('*/waInstance:id/getStateInstance/:token', () => {
        requests += 1
        return HttpResponse.json({ stateInstance: 'starting' })
      }),
    )
    const { user } = await signIn('3100000001')
    await screen.findByRole('heading', { name: 'Инстанс запускается' })
    await user.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(screen.getByLabelText('idInstance')).toHaveValue('3100000001')

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(requests).toBe(1)
  })

  it('неверный токен → ошибка, поля заполнены', async () => {
    await signIn('3100000001', 'wrong')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный idInstance или apiTokenInstance',
    )
    expect(screen.getByLabelText('apiTokenInstance')).toHaveValue('wrong')
  })

  it('нет интернета → «Нет соединения с интернетом»', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    server.use(http.get('*/waInstance:id/getStateInstance/:token', () => HttpResponse.error()))
    await signIn('3100000001')
    expect(await screen.findByRole('alert')).toHaveTextContent('Нет соединения с интернетом')
  })

  it('429 и 5xx → понятные тексты', async () => {
    await signIn('3100000029')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Слишком много запросов. Попробуйте через минуту',
    )
  })

  it('токена нет ни в тексте страницы, ни в URL', async () => {
    const { router } = await signIn('3100000001', 'wrong')
    await screen.findByRole('alert')
    expect(document.body.textContent).not.toContain('wrong')
    expect(router.state.location.pathname + router.state.location.search).not.toContain('wrong')
  })
})
