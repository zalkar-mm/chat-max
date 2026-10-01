import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session/model/session.store'

import { FAILURES_BEFORE_BANNER, ReceivePhase, useReceiveStore } from './model/receive.store'
import type * as ReceiveServiceModule from './model/receive-service'
import { recheckReceiving } from './model/receive-service'
import { ReceiveErrorBanners, ReceiveWarningBanners } from './receive-banners'

vi.mock('./model/receive-service', async (importOriginal) => {
  const actual = await importOriginal<typeof ReceiveServiceModule>()
  return { ...actual, recheckReceiving: vi.fn(() => Promise.resolve()) }
})

const WEBHOOK_TEXT =
  'Получение сообщений отключено: в настройках инстанса указан Webhook URL. Очистите его в личном кабинете и подождите около минуты'
const DISCONNECTED_TEXT = 'Инстанс отключён от MAX. Отсканируйте QR-код в личном кабинете'
const QUOTA_TEXT =
  'Лимит бесплатного тарифа GREEN-API исчерпан. Часть функций недоступна до смены тарифа'
const INCOMING_TEXT =
  'В настройках инстанса выключено получение входящих сообщений — ответы не будут приходить'

const showServiceUnavailable = (retryAt: number) => {
  act(() => {
    useReceiveStore.setState({ consecutiveFailures: FAILURES_BEFORE_BANNER, retryAt })
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.mocked(recheckReceiving).mockClear()
})

describe('Ошибки получения', () => {
  it('ничего не показывает, пока проблем нет', () => {
    render(<ReceiveErrorBanners maxErrors={2} />)
    expect(screen.queryByText(/GREEN-API|Инстанс|Webhook/)).not.toBeInTheDocument()
  })

  it('Webhook URL: текст, ссылка на личный кабинет и «Проверить снова» вызывает проверку', async () => {
    const user = userEvent.setup()
    render(<ReceiveErrorBanners maxErrors={2} />)
    act(() => {
      useReceiveStore.setState({ phase: ReceivePhase.WebhookConfigured })
    })

    expect(screen.getByText(WEBHOOK_TEXT)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Открыть личный кабинет' })
    expect(link).toHaveAttribute('href', 'https://console.green-api.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    await user.click(screen.getByRole('button', { name: 'Проверить снова' }))
    expect(recheckReceiving).toHaveBeenCalledTimes(1)
  })

  it('во время проверки: «Проверяем…», кнопка занята, ссылка неактивна', () => {
    render(<ReceiveErrorBanners maxErrors={2} />)
    act(() => {
      useReceiveStore.setState({ phase: ReceivePhase.InstanceDisconnected, isRechecking: true })
    })

    expect(screen.getByText(DISCONNECTED_TEXT)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Проверяем…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('button', { name: 'Проверить снова' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Открыть личный кабинет' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('сервис недоступен: обратный отсчёт раз в секунду, на нуле «Повторяем…»', () => {
    vi.useFakeTimers()
    render(<ReceiveErrorBanners maxErrors={2} />)
    showServiceUnavailable(Date.now() + 5_000)

    const banner = screen.getByText(/Сервис GREEN-API недоступен/)
    expect(banner).toHaveTextContent('Сервис GREEN-API недоступен. Повторим через 5 с')

    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(banner).toHaveTextContent('Повторим через 4 с')

    act(() => {
      vi.advanceTimersByTime(4_000)
    })
    expect(banner).toHaveTextContent('Сервис GREEN-API недоступен. Повторяем…')
  })

  it('меньше трёх сбоев подряд — баннера «сервис недоступен» нет', () => {
    render(<ReceiveErrorBanners maxErrors={2} />)
    act(() => {
      useReceiveStore.setState({ consecutiveFailures: 2, retryAt: Date.now() + 5_000 })
    })
    expect(screen.queryByText(/Сервис GREEN-API недоступен/)).not.toBeInTheDocument()
  })

  it('лимит: при одном свободном слоте показывается только самый важный', () => {
    render(<ReceiveErrorBanners maxErrors={1} />)
    act(() => {
      useReceiveStore.setState({ phase: ReceivePhase.InstanceDisconnected })
    })
    showServiceUnavailable(Date.now() + 5_000)

    expect(screen.getByText(/Сервис GREEN-API недоступен/)).toBeInTheDocument()
    expect(screen.queryByText(DISCONNECTED_TEXT)).not.toBeInTheDocument()
  })

  it('сервис недоступен идёт выше отключённого инстанса', () => {
    render(<ReceiveErrorBanners maxErrors={2} />)
    act(() => {
      useReceiveStore.setState({ phase: ReceivePhase.InstanceDisconnected })
    })
    showServiceUnavailable(Date.now() + 5_000)

    const service = screen.getByText(/Сервис GREEN-API недоступен/)
    const disconnected = screen.getByText(DISCONNECTED_TEXT)
    expect(
      service.compareDocumentPosition(disconnected) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})

describe('Предупреждения получения', () => {
  it('лимит тарифа: баннер закрывается «×»', () => {
    render(<ReceiveWarningBanners maxWarnings={1} />)
    act(() => {
      useSessionStore.setState({ isQuotaExceeded: true })
    })
    expect(screen.getByText(QUOTA_TEXT)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }))
    expect(screen.queryByText(QUOTA_TEXT)).not.toBeInTheDocument()
    expect(useSessionStore.getState().isQuotaBannerDismissed).toBe(true)
  })

  it('выключены входящие: ссылка на кабинет, «×» скрывает; ждёт, пока закроют лимит', () => {
    render(<ReceiveWarningBanners maxWarnings={1} />)
    act(() => {
      useSessionStore.setState({ isQuotaExceeded: true })
      useReceiveStore.setState({ isIncomingDisabled: true })
    })
    expect(screen.queryByText(INCOMING_TEXT)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }))
    expect(screen.getByText(INCOMING_TEXT)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Открыть личный кабинет' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Скрыть' }))
    expect(screen.queryByText(INCOMING_TEXT)).not.toBeInTheDocument()
  })

  it('без свободного слота предупреждения не показываются', () => {
    render(<ReceiveWarningBanners maxWarnings={0} />)
    act(() => {
      useSessionStore.setState({ isQuotaExceeded: true })
    })
    expect(screen.queryByText(QUOTA_TEXT)).not.toBeInTheDocument()
  })
})
