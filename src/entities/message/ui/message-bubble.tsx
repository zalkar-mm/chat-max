import type { ReactNode } from 'react'

import { Check, CheckCheck, Clock, File } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

import { formatMessageTime } from '../lib/format-message-time'
import type { Message } from '../model/message.types'

type MessageBubbleProps = {
  message: Message
  isLastInGroup: boolean
  /** Как скринридеру назвать автора входящего: имя собеседника или номер. */
  senderLabel: string
  /** Сообщение пришло, пока лента открыта, — появляется с анимацией (DS §5). */
  isNew?: boolean
  footer?: ReactNode
  aside?: ReactNode
}

type Direction = Message['direction']
type MetaKind = 'incoming' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

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
  delivered: 'доставлено',
  read: 'прочитано',
  failed: 'не отправлено',
}

const STATUS_ICON_CN = 'text-bubble-out-status size-4 shrink-0'

const STATUS_ICON: Record<MetaKind, ReactNode> = {
  incoming: null,
  sending: <Clock className={cn(STATUS_ICON_CN, 'opacity-70')} aria-hidden />,
  sent: <Check className={STATUS_ICON_CN} aria-hidden />,
  delivered: <CheckCheck className={STATUS_ICON_CN} aria-hidden />,
  // Прочитано — белый 100% и толще линия: второй цвет на синем градиенте не читается (DS спринта 3).
  read: <CheckCheck className="size-4 shrink-0 text-white" strokeWidth={2.5} aria-hidden />,
  // Ошибку показывают aside и footer: красная иконка на синем градиенте плохо читается.
  failed: null,
}

const toMetaKind = (message: Message): MetaKind =>
  message.direction === 'incoming' ? 'incoming' : message.delivery.status

const UNSUPPORTED_TEXT = 'Сообщение этого типа не поддерживается'

const toPlainText = (message: Message) =>
  message.content === 'unsupported' ? UNSUPPORTED_TEXT : message.text

/** DS §3: «Вы, 14:05, доставлено: текст» / «Анна, 14:06: текст». */
function toAriaLabel(
  message: Message,
  senderLabel: string,
  time: string,
  statusLabel: string | null,
) {
  const author = message.direction === 'outgoing' ? 'Вы' : senderLabel
  const meta = [author, time, statusLabel].filter((part) => part !== null).join(', ')
  return `${meta}: ${toPlainText(message)}`
}

function MessageText({ message }: { message: Message }) {
  if (message.content === 'unsupported') {
    return (
      <span className="inline-flex items-center gap-1.5 typo-body italic opacity-80">
        <File className="size-4 shrink-0" aria-hidden />
        {UNSUPPORTED_TEXT}
      </span>
    )
  }
  return (
    <span className="typo-body whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</span>
  )
}

export function MessageBubble({
  message,
  isLastInGroup,
  senderLabel,
  isNew = false,
  footer,
  aside,
}: MessageBubbleProps) {
  const { direction } = message
  const metaKind = toMetaKind(message)
  const time = formatMessageTime(message.createdAt)
  const statusLabel = STATUS_LABEL[metaKind]
  // Скринридер читает «14:05, отправлено»: время видимое, статус — только для него.
  const statusSuffix = statusLabel === null ? '' : `, ${statusLabel}`
  const isFailed = metaKind === 'failed'

  const ariaLabel = toAriaLabel(message, senderLabel, time, statusLabel)

  const rowCn = cn('flex', ROW_CN[direction], isNew && 'animate-appear')
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
    <article className={rowCn} aria-label={ariaLabel}>
      <div className={columnCn}>
        <div className="flex max-w-full items-end gap-2">
          {aside}
          <div className={bubbleCn}>
            <MessageText message={message} />
            <span className={metaCn}>
              <span>{time}</span>
              {STATUS_ICON[metaKind]}
              <span className="sr-only">{statusSuffix}</span>
            </span>
          </div>
        </div>
        {footer}
      </div>
    </article>
  )
}
