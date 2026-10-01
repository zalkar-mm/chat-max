import { BellOff, ServerCrash, TriangleAlert, Unplug, Webhook } from 'lucide-react'

import { GREEN_API_CONSOLE_URL } from '@/shared/config/env'
import { Banner, BannerAction, BannerLink } from '@/shared/ui/banner'
import { Gate } from '@/shared/ui/gate'

import { useCountdown } from '../model/use-countdown'

type ServiceUnavailableBannerProps = {
  retryAt: number | null
}

type RecheckActionsProps = {
  isRechecking: boolean
  onRecheck: () => void
}

type InstanceProblemBannerProps = RecheckActionsProps

type DismissibleBannerProps = {
  onDismiss: () => void
}

type ConsoleLinkProps = {
  disabled?: boolean
}

type RetryCountdownProps = {
  secondsLeft: number
}

function ConsoleLink({ disabled = false }: ConsoleLinkProps) {
  return (
    <BannerLink href={GREEN_API_CONSOLE_URL} disabled={disabled}>
      Открыть личный кабинет
    </BannerLink>
  )
}

function RecheckActions({ isRechecking, onRecheck }: RecheckActionsProps) {
  const recheckLabel = isRechecking ? 'Проверяем…' : 'Проверить снова'

  return (
    <>
      <ConsoleLink disabled={isRechecking} />
      <BannerAction loading={isRechecking} onClick={onRecheck}>
        {recheckLabel}
      </BannerAction>
    </>
  )
}

function RetryCountdown({ secondsLeft }: RetryCountdownProps) {
  return (
    <Gate when={secondsLeft > 0} fallback="Повторяем…">
      Повторим через{' '}
      <span className="inline-block min-w-[2ch] tabular-nums" aria-live="off">
        {secondsLeft}
      </span>{' '}
      с
    </Gate>
  )
}

export function ServiceUnavailableBanner({ retryAt }: ServiceUnavailableBannerProps) {
  const secondsLeft = useCountdown(retryAt)
  if (secondsLeft === null) return null

  return (
    <Banner tone="error" icon={<ServerCrash className="size-5" aria-hidden />}>
      Сервис GREEN-API недоступен. <RetryCountdown secondsLeft={secondsLeft} />
    </Banner>
  )
}

export function WebhookConfiguredBanner({ isRechecking, onRecheck }: InstanceProblemBannerProps) {
  return (
    <Banner
      tone="error"
      icon={<Webhook className="size-5" aria-hidden />}
      actions={<RecheckActions isRechecking={isRechecking} onRecheck={onRecheck} />}
    >
      Получение сообщений отключено: в настройках инстанса указан Webhook URL. Очистите его в личном
      кабинете и подождите около минуты
    </Banner>
  )
}

export function InstanceDisconnectedBanner({
  isRechecking,
  onRecheck,
}: InstanceProblemBannerProps) {
  return (
    <Banner
      tone="error"
      icon={<Unplug className="size-5" aria-hidden />}
      actions={<RecheckActions isRechecking={isRechecking} onRecheck={onRecheck} />}
    >
      Инстанс отключён от MAX. Отсканируйте QR-код в личном кабинете
    </Banner>
  )
}

export function QuotaExceededBanner({ onDismiss }: DismissibleBannerProps) {
  return (
    <Banner
      tone="warn"
      icon={<TriangleAlert className="size-5" aria-hidden />}
      onDismiss={onDismiss}
    >
      Лимит бесплатного тарифа GREEN-API исчерпан. Часть функций недоступна до смены тарифа
    </Banner>
  )
}

export function IncomingDisabledBanner({ onDismiss }: DismissibleBannerProps) {
  return (
    <Banner
      tone="warn"
      icon={<BellOff className="size-5" aria-hidden />}
      actions={<ConsoleLink />}
      onDismiss={onDismiss}
    >
      В настройках инстанса выключено получение входящих сообщений — ответы не будут приходить
    </Banner>
  )
}
