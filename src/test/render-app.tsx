import { StrictMode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'

import { QueryProvider } from '@/app/providers/query-provider'
import { routes } from '@/app/router/routes'

import { initSignInFlow } from '@/features/sign-in/model/sign-in-flow.store'

import { formatPhone, normalizePhone } from '@/entities/chat/lib/phone'
import { useSessionStore } from '@/entities/session/model/session.store'

// Ленивые страницы роутера загружаются заранее, чтобы renderApp не зависел от времени импорта.
await Promise.all([import('@/pages/sign-in/sign-in.page'), import('@/pages/chats/chats.page')])

const MAX_INIT_TICKS = 100

type RenderAppOptions = {
  path?: string
  advanceTimers?: (ms: number) => unknown
}

/**
 * Приложение целиком на memory-роутере: сторы сброшены, сессия решается по текущему хранилищу.
 * Страницы — ленивые чанки: ждём, пока роутер их загрузит, чтобы тест начинал с отрисованного экрана.
 */
export async function renderApp({ path = '/', advanceTimers }: RenderAppOptions = {}) {
  useSessionStore.setState({
    credentials: null,
    instanceState: null,
    isSuspendedBannerDismissed: false,
  })
  initSignInFlow()

  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : {})
  const view = render(
    <StrictMode>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </StrictMode>,
  )
  // Модули страниц уже в кэше: роутер грузит их за несколько микрозадач. Таймеры не нужны —
  // работает и с фейковыми таймерами.
  await act(async () => {
    for (let tick = 0; tick < MAX_INIT_TICKS && !router.state.initialized; tick += 1) {
      await Promise.resolve()
    }
  })
  return { ...view, user, router }
}

const STORAGE_KEY = 'max-chat:session'

/** Приложение с уже сохранённой сессией: ждём главный экран. */
export async function renderSignedInApp({
  idInstance = '3100000001',
  ...options
}: RenderAppOptions & { idInstance?: string } = {}) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      idInstance,
      apiTokenInstance: 'token',
      apiUrl: 'https://3100.api.green-api.com',
    }),
  )
  const view = await renderApp(options)
  await screen.findByRole('heading', { name: 'Чаты' })
  return view
}

/** Создать чат через форму «Новый чат» и дождаться его открытия. */
export async function createChatViaForm(user: ReturnType<typeof userEvent.setup>, phone: string) {
  await user.click(screen.getByRole('button', { name: 'Новый чат' }))
  await user.type(await screen.findByLabelText('Номер телефона'), `${phone}{Enter}`)
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  // Переход на чат — transition роутера: ждём, пока смонтируется окно именно этого чата
  // (поле ввода предыдущего открытого чата живёт до коммита перехода).
  await screen.findByRole('region', { name: formatPhone(normalizePhone(phone)) })
}
