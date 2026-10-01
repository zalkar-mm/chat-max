import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_API_URL } from '@/shared/config/env'

import { server } from '@/mocks/node'
import { renderApp } from '@/test/render-app'

const STORAGE_KEY = 'max-chat:session'

const storedCredentials = (idInstance = '3100000001') =>
  JSON.stringify({
    idInstance,
    apiTokenInstance: 'token',
    apiUrl: 'https://3100.api.green-api.com',
  })

describe('Задача 3 — сохранение и восстановление сессии', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('без «Запомнить меня» креды в sessionStorage, с ним — в localStorage', async () => {
    const view = await renderApp({ path: '/sign-in' })
    await view.user.type(screen.getByLabelText('idInstance'), '3100000001')
    await view.user.type(screen.getByLabelText('apiTokenInstance'), 'token')
    await view.user.click(screen.getByRole('checkbox', { name: /Запомнить меня/ }))
    await view.user.click(screen.getByRole('button', { name: 'Войти' }))
    await screen.findByRole('heading', { name: 'Чаты' })

    // apiUrl в форме не трогали — сохраняется хост по умолчанию.
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({
        idInstance: '3100000001',
        apiTokenInstance: 'token',
        apiUrl: DEFAULT_API_URL,
      }),
    )
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('1: сохранённая сессия → после проверки главный экран без ввода', async () => {
    sessionStorage.setItem(STORAGE_KEY, storedCredentials())
    await renderApp()
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('6: при старте с сохранёнными данными форма входа не мелькает', async () => {
    localStorage.setItem(STORAGE_KEY, storedCredentials())
    await renderApp()
    expect(screen.queryByLabelText('idInstance')).not.toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Чаты' })
  })

  it('4: токен сменили → вход с «Сессия недействительна», хранилище очищено', async () => {
    localStorage.setItem(STORAGE_KEY, storedCredentials())
    server.use(
      http.get(
        '*/waInstance:id/getStateInstance/:token',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    await renderApp()
    expect(await screen.findByText('Сессия недействительна, войдите снова')).toBeInTheDocument()
    expect(screen.getByLabelText('idInstance')).toHaveValue('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('5: нет интернета при старте → «Нет соединения»; «Повторить» пускает в приложение', async () => {
    sessionStorage.setItem(STORAGE_KEY, storedCredentials())
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    server.use(http.get('*/waInstance:id/getStateInstance/:token', () => HttpResponse.error()))
    const { user } = await renderApp()

    expect(await screen.findByRole('heading', { name: 'Нет соединения' })).toBeInTheDocument()
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()

    onLine.mockReturnValue(true)
    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('блокирующий статус при старте → соответствующий экран', async () => {
    sessionStorage.setItem(STORAGE_KEY, storedCredentials('3100000003'))
    await renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Инстанс не подключён к MAX' }),
    ).toBeInTheDocument()
  })
})
