import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  FAILURES_BEFORE_BANNER,
  ReceivePhase,
  useReceiveStore,
} from '@/features/receive-messages/model/receive.store'

import { InstanceState } from '@/entities/session/model/instance-state'
import { useSessionStore } from '@/entities/session/model/session.store'

import { ConnectionStatus, useConnectionStore } from '@/shared/lib/connection/connection.store'

import { StatusBanners } from './status-banners'

const OFFLINE_TEXT = 'Нет соединения. Переподключаемся…'
const SUSPENDED_TEXT = /Аккаунт MAX временно ограничен/
const QUOTA_TEXT = /Лимит бесплатного тарифа GREEN-API исчерпан/

describe('Стек баннеров', () => {
  it('офлайн + 2 ошибки получения → видно не больше двух ошибок', () => {
    render(<StatusBanners />)
    act(() => {
      useConnectionStore.setState({ status: ConnectionStatus.Offline })
      useReceiveStore.setState({
        phase: ReceivePhase.WebhookConfigured,
        consecutiveFailures: FAILURES_BEFORE_BANNER,
        retryAt: Date.now() + 5_000,
      })
    })

    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(OFFLINE_TEXT)).toBeInTheDocument()
    expect(within(alert).getByText(/Сервис GREEN-API недоступен/)).toBeInTheDocument()
    expect(within(alert).queryByText(/Webhook URL/)).not.toBeInTheDocument()
  })

  it('без офлайна обе ошибки получения видны', () => {
    render(<StatusBanners />)
    act(() => {
      useConnectionStore.setState({ status: ConnectionStatus.Online })
      useReceiveStore.setState({
        phase: ReceivePhase.WebhookConfigured,
        consecutiveFailures: FAILURES_BEFORE_BANNER,
        retryAt: Date.now() + 5_000,
      })
    })

    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(/Сервис GREEN-API недоступен/)).toBeInTheDocument()
    expect(within(alert).getByText(/Webhook URL/)).toBeInTheDocument()
  })

  it('suspended занимает единственный слот предупреждения, лимит ждёт', () => {
    render(<StatusBanners />)
    act(() => {
      useSessionStore.setState({ instanceState: InstanceState.Suspended, isQuotaExceeded: true })
    })

    const status = screen.getByRole('status')
    expect(within(status).getByText(SUSPENDED_TEXT)).toBeInTheDocument()
    expect(within(status).queryByText(QUOTA_TEXT)).not.toBeInTheDocument()

    act(() => {
      useSessionStore.getState().dismissSuspendedBanner()
    })
    expect(within(status).getByText(QUOTA_TEXT)).toBeInTheDocument()
  })
})
