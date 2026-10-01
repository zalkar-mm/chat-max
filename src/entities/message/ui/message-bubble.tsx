import type { ReactNode } from 'react'

import { Check, Clock } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

import { formatMessageTime } from '../lib/format-message-time'
import type { Message } from '../model/message.types'

type MessageBubbleProps = {
  message: Message
  isLastInGroup: boolean
  footer?: ReactNode
  aside?: ReactNode
}

type Direction = Message['direction']
type MetaKind = 'incoming' | 'sending' | 'sent' | 'failed'

const ROW_CN: Record<Direction, string> = {
  incoming: 'justify-start',
  outgoing: 'justify-end',
}

const COLUMN_CN: Record<Direction, string> = {
  incoming: 'items-start',
  outgoing: 'items-end',
}

const BUBBLE_CN: Record<Direction, string> = {
  incoming: 'bg-bubble-in text-bubble-in',
  outgoing: 'bg-bubble-out-gradient text-bubble-out',
}

const TAIL_CN: Record<Direction, string> = {
  incoming: 'rounded-bl-bubble-tail',
  outgoing: 'rounded-br-bubble-tail',
}

const TIME_CN: Record<Direction, string> = {
  incoming: 'text-bubble-in-time',
  outgoing: 'text-bubble-out-time',
}

const STATUS_LABEL: Record<MetaKind, string | null> = {
  incoming: null,
  sending: 'отправляется',
  sent: 'отправлено',
  failed: 'не отправлено',
}

const STATUS_ICON_CN = 'text-bubble-out-status size-4 shrink-0'

const STATUS_ICON: Record<MetaKind, ReactNode> = {
  incoming: null,
  sending: <Clock className={cn(STATUS_ICON_CN, 'opacity-70')} aria-hidden />,
  sent: <Check className={STATUS_ICON_CN} aria-hidden />,
  // Ошибку показывают aside и footer: красная иконка на синем градиенте плохо читается.
  failed: null,
}

const toMetaKind = (message: Message): MetaKind =>
  message.direction === 'incoming' ? 'incoming' : message.delivery.status

export function MessageBubble({ message, isLastInGroup, footer, aside }: MessageBubbleProps) {
  const { direction } = message
  const metaKind = toMetaKind(message)
  const time = formatMessageTime(message.createdAt)
  const statusLabel = STATUS_LABEL[metaKind]
  const metaLabel = statusLabel === null ? time : `${time}, ${statusLabel}`
  const isFailed = metaKind === 'failed'

  const rowCn = cn('flex', ROW_CN[direction])
  const columnCn = cn('flex max-w-[85%] min-w-0 flex-col md:max-w-120', COLUMN_CN[direction])
  const bubbleCn = cn(
    'min-w-18 max-w-full flow-root rounded-l px-3 pt-2 pb-1.5',
    BUBBLE_CN[direction],
    isLastInGroup && TAIL_CN[direction],
    isFailed && 'opacity-85',
  )
  const metaCn = cn(
    'typo-bubble-label float-right mt-1 ml-2 inline-flex items-center gap-1',
    TIME_CN[direction],
  )

  return (
    <div className={rowCn}>
      <div className={columnCn}>
        <div className="flex max-w-full items-end gap-2">
          {aside}
          <div className={bubbleCn}>
            <span className="typo-body whitespace-pre-wrap [overflow-wrap:anywhere]">
              {message.text}
            </span>
            <span className={metaCn} aria-label={metaLabel}>
              <span aria-hidden>{time}</span>
              {STATUS_ICON[metaKind]}
            </span>
          </div>
        </div>
        {footer}
      </div>
    </div>
  )
}
