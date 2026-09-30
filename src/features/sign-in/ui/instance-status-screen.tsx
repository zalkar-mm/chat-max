import type { ReactNode } from 'react'

import { Ban, Clock, ExternalLink, Lock, QrCode } from 'lucide-react'

import type { BlockingInstanceState } from '@/entities/session/model/instance-state'

import { GREEN_API_CONSOLE_URL } from '@/shared/config/env'
import { cn } from '@/shared/lib/cn'
import { Button, buttonVariants } from '@/shared/ui/button'
import { InlineAlert } from '@/shared/ui/inline-alert'
import { Logo } from '@/shared/ui/logo'
import { Spinner } from '@/shared/ui/spinner'
import { StatusScreen } from '@/shared/ui/status-screen'

import { STARTING_MAX_ATTEMPTS } from '../model/starting-poller'

export type StatusView = BlockingInstanceState | 'startingTimedOut'

type StatusAction = 'console' | 'recheck' | 'edit' | 'cancel'
type ActionVariant = 'primary' | 'secondary' | 'ghost'

type StatusConfig = {
  visual: ReactNode
  tone: 'neutral' | 'negative'
  title: string
  description: string
  actions: readonly (readonly [StatusAction, ActionVariant])[]
}

const ICON_CN = 'size-16'

const STATUS_CONFIG: Readonly<Record<StatusView, StatusConfig>> = {
  notAuthorized: {
    visual: <QrCode className={ICON_CN} aria-hidden />,
    tone: 'neutral',
    title: 'Инстанс не подключён к MAX',
    description:
      'Отсканируйте QR-код в личном кабинете GREEN-API: MAX → Профиль → Устройства → Войти по QR-коду',
    actions: [
      ['console', 'primary'],
      ['recheck', 'secondary'],
      ['edit', 'ghost'],
    ],
  },
  starting: {
    visual: <Spinner size={32} className="text-accent" />,
    tone: 'neutral',
    title: 'Инстанс запускается',
    description: 'Обычно это занимает до 5 минут. Проверяем автоматически…',
    actions: [['cancel', 'ghost']],
  },
  startingTimedOut: {
    visual: <Clock className={ICON_CN} aria-hidden />,
    tone: 'negative',
    title: 'Инстанс долго не запускается',
    description: 'Перезапустите его в личном кабинете GREEN-API',
    actions: [
      ['console', 'primary'],
      ['recheck', 'secondary'],
      ['edit', 'ghost'],
    ],
  },
  blocked: {
    visual: <Ban className={ICON_CN} aria-hidden />,
    tone: 'negative',
    title: 'Аккаунт MAX заблокирован',
    description: 'Этот инстанс нельзя использовать для отправки сообщений',
    actions: [['edit', 'secondary']],
  },
  pendingPassword: {
    visual: <Lock className={ICON_CN} aria-hidden />,
    tone: 'neutral',
    title: 'Нужен пароль двухфакторной защиты',
    description: 'Завершите подключение инстанса в личном кабинете GREEN-API',
    actions: [
      ['console', 'primary'],
      ['recheck', 'secondary'],
    ],
  },
}

type InstanceStatusScreenProps = {
  view: StatusView
  attempt: number
  isRechecking: boolean
  errorText: string | null
  onRecheck: () => void
  onEdit: () => void
  onCancel: () => void
}

type StatusActionButtonProps = Omit<InstanceStatusScreenProps, 'view' | 'attempt' | 'errorText'> & {
  action: StatusAction
  variant: ActionVariant
}

function StatusActionButton({
  action,
  variant,
  isRechecking,
  onRecheck,
  onEdit,
  onCancel,
}: StatusActionButtonProps) {
  if (action === 'console') {
    const linkCn = cn(
      buttonVariants({ variant }),
      'w-full',
      isRechecking && 'pointer-events-none opacity-60',
    )
    return (
      <a
        className={linkCn}
        href={GREEN_API_CONSOLE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={isRechecking}
      >
        Открыть личный кабинет
        <ExternalLink className="size-4" aria-hidden />
      </a>
    )
  }
  if (action === 'recheck') {
    const text = isRechecking ? 'Проверяем…' : 'Проверить снова'
    return (
      <Button variant={variant} className="w-full" loading={isRechecking} onClick={onRecheck}>
        {text}
      </Button>
    )
  }

  const handleClick = action === 'edit' ? onEdit : onCancel
  const text = action === 'edit' ? 'Изменить данные' : 'Отмена'
  return (
    <Button variant={variant} className="w-full" disabled={isRechecking} onClick={handleClick}>
      {text}
    </Button>
  )
}

function StatusError({ text }: { text: string | null }) {
  if (text === null) return null
  return (
    <div className="mb-2 text-left">
      <InlineAlert tone="error">{text}</InlineAlert>
    </div>
  )
}

export function InstanceStatusScreen({
  view,
  attempt,
  errorText,
  ...actionProps
}: InstanceStatusScreenProps) {
  const config = STATUS_CONFIG[view]
  const footnote =
    view === 'starting' && attempt > 0
      ? `Попытка ${attempt} из ${STARTING_MAX_ATTEMPTS}`
      : undefined

  return (
    <div className="flex flex-col items-center gap-8">
      <Logo />
      <StatusScreen
        visual={config.visual}
        tone={config.tone}
        title={config.title}
        description={config.description}
        footnote={footnote}
        focusTitle
      >
        <StatusError text={errorText} />
        {config.actions.map(([action, variant]) => (
          <StatusActionButton key={action} action={action} variant={variant} {...actionProps} />
        ))}
      </StatusScreen>
    </div>
  )
}
