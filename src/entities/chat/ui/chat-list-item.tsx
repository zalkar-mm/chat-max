import { AlertCircle, Check, Clock, type LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Gate } from '@/shared/ui/gate'

import { ChatAvatar } from './chat-avatar'

export type ChatListItemStatus = 'sending' | 'sent' | 'failed'

const MAX_UNREAD = 99

const STATUS_VIEW: Record<
  ChatListItemStatus,
  { Icon: LucideIcon; className: string; label: string }
> = {
  sending: { Icon: Clock, className: 'text-icon-tertiary', label: 'отправляется' },
  sent: { Icon: Check, className: 'text-icon-tertiary', label: 'отправлено' },
  failed: { Icon: AlertCircle, className: 'text-bubble-status-error', label: 'не отправлено' },
}

type LastMessageStatusProps = {
  status: ChatListItemStatus | null
}

function LastMessageStatus({ status }: LastMessageStatusProps) {
  if (status === null) return null
  const { Icon, className, label } = STATUS_VIEW[status]
  const iconCn = cn('size-4', className)

  return (
    <span className="ml-2 flex size-5 shrink-0 items-center justify-center">
      <Icon className={iconCn} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export type ChatListItemProps = {
  chatId: string
  title: string
  preview: string | null
  time: string | null
  status: ChatListItemStatus | null
  unreadCount: number
  isSelected: boolean
  onOpen: (chatId: string) => void
}

export function ChatListItem({
  chatId,
  title,
  preview,
  time,
  status,
  unreadCount,
  isSelected,
  onOpen,
}: ChatListItemProps) {
  const hasUnread = unreadCount > 0
  const hasPreview = preview !== null
  const hasTime = time !== null
  const unreadLabel = unreadCount > MAX_UNREAD ? `${MAX_UNREAD}+` : String(unreadCount)
  const ariaCurrent = isSelected ? 'true' : undefined

  const rootCn = cn(
    'flex h-18 min-w-0 items-center gap-3 rounded-l px-4 py-3',
    'transition-colors duration-120 ease-out hover:bg-cell-hover active:bg-cell-pressed',
    'focus-visible:-outline-offset-2',
    isSelected && 'md:bg-cell-selected',
  )
  const titleCn = cn(
    'min-w-0 flex-1 truncate text-primary',
    hasUnread ? 'typo-body-strong' : 'typo-body',
  )
  const timeCn = cn('ml-2 shrink-0 typo-description', hasUnread ? 'text-link' : 'text-tertiary')

  const handleClick = () => {
    onOpen(chatId)
  }

  return (
    <Button variant="plain" className={rootCn} aria-current={ariaCurrent} onClick={handleClick}>
      <ChatAvatar chatId={chatId} size={48} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-baseline">
          <span className={titleCn}>{title}</span>
          <Gate when={hasTime}>
            <span className={timeCn}>{time}</span>
          </Gate>
        </span>
        <span className="flex min-w-0 items-center">
          <Gate
            when={hasPreview}
            fallback={
              <span className="min-w-0 flex-1 truncate typo-detail text-tertiary">
                Нет сообщений
              </span>
            }
          >
            <span className="min-w-0 flex-1 truncate typo-detail text-secondary">{preview}</span>
          </Gate>
          <Gate when={hasUnread} fallback={<LastMessageStatus status={status} />}>
            <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-counter px-1.5 typo-label font-medium text-counter">
              {unreadLabel}
            </span>
          </Gate>
        </span>
      </span>
    </Button>
  )
}
