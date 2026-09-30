import { createMemoryRouter, RouterProvider } from 'react-router'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QueryProvider } from '@/app/providers/query-provider'

import { useSessionStore } from '@/entities/session/model/session.store'

import { AppCrashScreen } from './app-crash-screen'

function Broken(): never {
  throw new Error('boom')
}

const renderCrash = () => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Broken />, errorElement: <AppCrashScreen /> },
      { path: '/sign-in', element: <h1>Вход</h1> },
    ],
    { initialEntries: ['/'] },
  )
  render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>,
  )
  return router
}

describe('Задача 7 — экран «Что-то пошло не так»', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1: ошибка в компоненте → экран сбоя вместо белого', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderCrash()
    expect(screen.getByRole('heading', { name: 'Что-то пошло не так' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Перезагрузить' })).toBeInTheDocument()
  })

  it('3: «Выйти» → экран входа, сессия очищена', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    useSessionStore.getState().startSession({
      credentials: { idInstance: '1', apiTokenInstance: 't', apiUrl: 'https://x' },
      instanceState: 'authorized',
      remember: true,
    })
    const router = renderCrash()
    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(useSessionStore.getState().credentials).toBeNull()
    expect(localStorage.getItem('max-chat:session')).toBeNull()
  })
})
