import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'

import {
  MessageSendFailure,
  MessageSendFailureIcon,
} from '@/features/send-message/message-send-failure'

import { buildMessageRows, type MessageRow } from '@/entities/message/lib/group-messages'
import { useChatMessages } from '@/entities/message/model/message.store'
import type { Message } from '@/entities/message/model/message.types'
import { DayDivider } from '@/entities/message/ui/day-divider'
import { MessageBubble } from '@/entities/message/ui/message-bubble'

import { cn } from '@/shared/lib/cn'
import { useNow } from '@/shared/lib/use-now'
import { Gate } from '@/shared/ui/gate'

import { NewMessagesButton } from './new-messages-button'

type MessageFeedProps = {
  chatId: string
  /** Название чата: подпись ленты и автор входящих для скринридера. */
  title: string
}

type FeedRowProps = {
  row: MessageRow
  senderLabel: string
  isNew: boolean
}

// Отступы по дизайну: 2px внутри группы одного автора, 8px между авторами; вокруг разделителя дня — свои 16px.
function FeedRowView({ row, senderLabel, isNew }: FeedRowProps) {
  if (row.kind === 'day') return <DayDivider label={row.label} />

  const rowCn = cn(row.isFirstInGroup ? 'mt-2' : 'mt-0.5')

  return (
    <div className={rowCn}>
      <MessageBubble
        message={row.message}
        isLastInGroup={row.isLastInGroup}
        senderLabel={senderLabel}
        isNew={isNew}
        aside={<MessageSendFailureIcon message={row.message} />}
        footer={<MessageSendFailure message={row.message} />}
      />
    </div>
  )
}

const isSameRow = (a: MessageRow, b: MessageRow) => {
  if (a.kind === 'day') return b.kind === 'day' && a.label === b.label
  if (b.kind === 'day') return false
  return (
    a.message === b.message &&
    a.isFirstInGroup === b.isFirstInGroup &&
    a.isLastInGroup === b.isLastInGroup
  )
}

// Строки пересобираются на каждое сообщение; перерисовываются только изменившиеся (длинные чаты, NFR-PERF).
const FeedRow = memo(
  FeedRowView,
  (prev, next) =>
    prev.senderLabel === next.senderLabel &&
    prev.isNew === next.isNew &&
    isSameRow(prev.row, next.row),
)

type FeedContentProps = {
  rows: readonly MessageRow[]
  senderLabel: string
  /** Сообщения, которые уже были при открытии ленты: они не анимируются. */
  initialIds: ReadonlySet<string>
}

function FeedContent({ rows, senderLabel, initialIds }: FeedContentProps) {
  if (rows.length === 0) {
    return (
      <p className="m-auto rounded-full bg-date-pill px-4 py-2 typo-detail text-secondary">
        Напишите первое сообщение
      </p>
    )
  }
  // День — отдельный блок: липкий разделитель держится только в пределах своего дня
  // и уезжает, когда подходит следующий, а не ложится поверх него.
  return splitByDay(rows).map((day) => (
    <div key={day.key}>
      {day.rows.map((row) => (
        <FeedRow
          key={row.key}
          row={row}
          senderLabel={senderLabel}
          isNew={!initialIds.has(row.key)}
        />
      ))}
    </div>
  ))
}

type DayRows = { key: string; rows: MessageRow[] }

function splitByDay(rows: readonly MessageRow[]): DayRows[] {
  const days: DayRows[] = []
  for (const row of rows) {
    const current = days.at(-1)
    if (row.kind === 'day' || current === undefined) days.push({ key: row.key, rows: [row] })
    else current.rows.push(row)
  }
  return days
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth')

/** Дальше этого расстояния от низа лента не прокручивается сама к новому входящему. */
const NEAR_BOTTOM_PX = 100

const isNearBottom = (feed: HTMLElement) =>
  feed.scrollHeight - feed.scrollTop - feed.clientHeight <= NEAR_BOTTOM_PX

const scrollToBottom = (feed: HTMLElement) => {
  feed.scrollTo({ top: feed.scrollHeight, behavior: scrollBehavior() })
}

const countIncoming = (messages: readonly Message[]) =>
  messages.filter((message) => message.direction === 'incoming').length

export function MessageFeed({ chatId, title }: MessageFeedProps) {
  const messages = useChatMessages(chatId)
  const [initialIds] = useState(() => new Set(messages.map((message) => message.id)))
  const now = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessage = messages.at(-1)
  // Своя отправка отсюда — только что добавленное «отправляется»; всё прочее (входящие, сообщения с телефона,
  // эхо) пришло извне и не должно дёргать ленту, если пользователь листает историю.
  const isLocalSend =
    lastMessage?.direction === 'outgoing' && lastMessage.delivery.status === 'sending'
  const lastLocalSendId = isLocalSend ? lastMessage.id : null
  const lastExternalId = isLocalSend ? null : (lastMessage?.id ?? null)
  const incomingCount = countIncoming(messages)

  // Число входящих в момент, когда пользователь ушёл от низа ленты; null — он внизу.
  const [incomingWhenAway, setIncomingWhenAway] = useState<number | null>(null)
  const isAwayRef = useRef(false)
  const seenExternalIdRef = useRef(lastExternalId)
  const isAway = incomingWhenAway !== null
  const newCount = isAway ? incomingCount - incomingWhenAway : 0
  const hasNewMessages = newCount > 0

  // Открытие чата — сразу внизу, до первого кадра, без анимации.
  useLayoutEffect(() => {
    const feed = scrollRef.current
    if (feed) feed.scrollTop = feed.scrollHeight
  }, [chatId])

  // Кто был внизу — остаётся внизу:
  // - лента сжалась (баннер сверху, клавиатура, многострочное поле) — сразу, без анимации;
  // - содержимое выросло без нового сообщения («Не отправлено. Повторить» под пузырём) — плавно.
  useEffect(() => {
    const feed = scrollRef.current
    const content = feed?.firstElementChild
    if (!feed || !content || typeof ResizeObserver === 'undefined') return
    const viewportObserver = new ResizeObserver(() => {
      if (!isAwayRef.current) feed.scrollTop = feed.scrollHeight
    })
    const contentObserver = new ResizeObserver(() => {
      if (!isAwayRef.current) scrollToBottom(feed)
    })
    viewportObserver.observe(feed)
    contentObserver.observe(content)
    return () => {
      viewportObserver.disconnect()
      contentObserver.disconnect()
    }
  }, [])

  // Своя отправка — плавно к новому сообщению.
  useEffect(() => {
    const feed = scrollRef.current
    if (!feed || lastLocalSendId === null) return
    scrollToBottom(feed)
  }, [lastLocalSendId])

  // Новое сообщение извне: пользователь внизу — плавно к нему; листает историю — лента не прыгает,
  // а у входящих растёт счётчик кнопки «↓».
  useEffect(() => {
    const feed = scrollRef.current
    if (!feed || lastExternalId === null || lastExternalId === seenExternalIdRef.current) return
    seenExternalIdRef.current = lastExternalId
    if (!isAwayRef.current) scrollToBottom(feed)
  }, [lastExternalId])

  const handleScroll = () => {
    const feed = scrollRef.current
    if (!feed) return
    const isAwayNow = !isNearBottom(feed)
    if (isAwayNow === isAwayRef.current) return
    isAwayRef.current = isAwayNow
    setIncomingWhenAway(isAwayNow ? incomingCount : null)
  }

  const handleScrollDown = () => {
    const feed = scrollRef.current
    if (feed) scrollToBottom(feed)
    isAwayRef.current = false
    setIncomingWhenAway(null)
  }

  const rows = buildMessageRows(messages, now)

  // Регион лога смонтирован и для пустого чата: первое сообщение объявляется скринридером.
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* id и tabIndex — цель ссылки «Перейти к сообщениям». */}
      <div
        ref={scrollRef}
        id="messages"
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        onScroll={handleScroll}
      >
        <div
          className="mx-auto flex w-full max-w-(--chat-content-max-w) flex-1 flex-col px-3 pt-3 pb-2 md:px-4 md:pt-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={`Сообщения с ${title}`}
        >
          <FeedContent rows={rows} senderLabel={title} initialIds={initialIds} />
        </div>
      </div>
      <Gate when={hasNewMessages}>
        <NewMessagesButton count={newCount} onClick={handleScrollDown} />
      </Gate>
    </div>
  )
}
