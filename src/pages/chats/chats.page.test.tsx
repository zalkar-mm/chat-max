import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderApp } from '@/test/render-app'

const STORAGE_KEY = 'max-chat:session'

const storeSession = (idInstance = '3100000001', storage: Storage = sessionStorage) => {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      idInstance,
      apiTokenInstance: 'token',
      apiUrl: 'https://3100.api.green-api.com',
    }),
  )
}

const openMainScreen = async (idInstance?: string) => {
  storeSession(idInstance)
  const view = renderApp()
  await screen.findByRole('heading', { name: 'Чаты' })
  return view
}

describe('Задача 4 — выход', () => {
  it('1–2: «Выйти» → вход с пустыми полями, сессии нет ни в одном хранилище', async () => {
    storeSession('3100000001', localStorage)
    const { user } = renderApp()
    await screen.findByRole('heading', { name: 'Чаты' })

    await user.click(screen.getByRole('button', { name: 'Выйти' }))
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument()
    expect(screen.getByLabelText('idInstance')).toHaveValue('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('Задача 5 — каркас главного экрана', () => {
  it('пустой список, «Выберите чат» и idInstance в шапке', async () => {
    await openMainScreen('3100000001')
    expect(screen.getByText('Здесь появятся ваши чаты')).toBeInTheDocument()
    expect(screen.getByText('Выберите чат или начните новый')).toBeInTheDocument()
    expect(screen.getByText('3100000001')).toBeInTheDocument()
  })

  it('«Новый чат» и «Начать новый чат» открывают заглушку', async () => {
    const { user } = await openMainScreen()
    await user.click(screen.getByRole('button', { name: 'Новый чат' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новый чат' })
    expect(within(dialog).getByText('Появится в следующей версии')).toBeInTheDocument()
    const [, closeButton] = within(dialog).getAllByRole('button', { name: 'Закрыть' })
    if (!closeButton) throw new Error('Нет кнопки «Закрыть» в заглушке')
    await user.click(closeButton)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Начать новый чат' }))
    expect(await screen.findByRole('dialog', { name: 'Новый чат' })).toBeInTheDocument()
  })
})

describe('Задача 6 — баннеры', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('1–2: офлайн → баннер; сеть вернулась → баннер исчез, 3 с «Соединение восстановлено»', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await openMainScreen()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Нет соединения. Переподключаемся…')

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText('Нет соединения. Переподключаемся…')).not.toBeInTheDocument()
    expect(screen.getByText('Соединение восстановлено')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(3_000))
    expect(screen.queryByText('Соединение восстановлено')).not.toBeInTheDocument()
  })

  it('3: suspended → жёлтый баннер; «×» скрывает; после F5 снова виден', async () => {
    const { user, unmount } = await openMainScreen('3100000002')
    const warning = 'Аккаунт MAX временно ограничен: сообщения можно отправлять только контактам'
    expect(screen.getByText(warning)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Скрыть' }))
    expect(screen.queryByText(warning)).not.toBeInTheDocument()

    unmount()
    renderApp()
    expect(await screen.findByText(warning)).toBeInTheDocument()
  })

  it('4: оба баннера — ошибка сверху', async () => {
    await openMainScreen('3100000002')
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    const offline = screen.getByText('Нет соединения. Переподключаемся…')
    const suspended = screen.getByText(/Аккаунт MAX временно ограничен/)
    expect(
      offline.compareDocumentPosition(suspended) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
  })
})
