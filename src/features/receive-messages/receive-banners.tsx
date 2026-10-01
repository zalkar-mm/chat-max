import { useIsQuotaBannerVisible, useSessionStore } from '@/entities/session/model/session.store'

import {
  ReceivePhase,
  useReceivePhase,
  useReceiveStore,
  useServiceUnavailableRetryAt,
} from './model/receive.store'
import { dismissIncomingWarning, recheckReceiving } from './model/receive-service'
import {
  IncomingDisabledBanner,
  InstanceDisconnectedBanner,
  QuotaExceededBanner,
  ServiceUnavailableBanner,
  WebhookConfiguredBanner,
} from './ui/receive-banner-items'
import { type ReceiveBannerItem, ReceiveBannerList } from './ui/receive-banner-list'

type ReceiveErrorBannersProps = {
  /** Сколько error-баннеров получения показать (офлайн виджета занимает один из двух слотов). */
  maxErrors: number
}

type ReceiveWarningBannersProps = {
  /** Сколько warn-баннеров получения показать (suspended виджета занимает единственный слот). */
  maxWarnings: number
}

const handleRecheck = () => {
  void recheckReceiving()
}

const handleDismissQuota = () => {
  useSessionStore.getState().dismissQuotaBanner()
}

const useIsIncomingWarningVisible = () =>
  useReceiveStore((state) => state.isIncomingDisabled && !state.isIncomingWarningDismissed)

/** Ошибки получения по приоритету: сервис недоступен → инстанс отключён → Webhook. */
export function ReceiveErrorBanners({ maxErrors }: ReceiveErrorBannersProps) {
  const retryAt = useServiceUnavailableRetryAt()
  const phase = useReceivePhase()
  const isRechecking = useReceiveStore((state) => state.isRechecking)

  const items: ReceiveBannerItem[] = [
    {
      key: 'service-unavailable',
      isVisible: retryAt !== null,
      render: () => <ServiceUnavailableBanner retryAt={retryAt} />,
    },
    {
      key: 'instance-disconnected',
      isVisible: phase === ReceivePhase.InstanceDisconnected,
      render: () => (
        <InstanceDisconnectedBanner isRechecking={isRechecking} onRecheck={handleRecheck} />
      ),
    },
    {
      key: 'webhook-configured',
      isVisible: phase === ReceivePhase.WebhookConfigured,
      render: () => (
        <WebhookConfiguredBanner isRechecking={isRechecking} onRecheck={handleRecheck} />
      ),
    },
  ]

  return <ReceiveBannerList items={items} limit={maxErrors} />
}

/** Предупреждения получения по приоритету: лимит тарифа → выключены входящие. */
export function ReceiveWarningBanners({ maxWarnings }: ReceiveWarningBannersProps) {
  const isQuotaVisible = useIsQuotaBannerVisible()
  const isIncomingVisible = useIsIncomingWarningVisible()

  const items: ReceiveBannerItem[] = [
    {
      key: 'quota-exceeded',
      isVisible: isQuotaVisible,
      render: () => <QuotaExceededBanner onDismiss={handleDismissQuota} />,
    },
    {
      key: 'incoming-disabled',
      isVisible: isIncomingVisible,
      render: () => <IncomingDisabledBanner onDismiss={dismissIncomingWarning} />,
    },
  ]

  return <ReceiveBannerList items={items} limit={maxWarnings} />
}
