import { useEffect, useLayoutEffect, useRef, useState } from 'react'

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
}

type FeedRowProps = {
  row: MessageRow
}

// Отступы по спеке: 2px внутри группы одного автора, 8px между авторами; вокруг разделителя дня — свои 16px.
function FeedRow({ row }: FeedRowProps) {
  if (row.kind === 'day') return <DayDivider label={row.label} />

  const rowCn = cn(row.isFirstInGroup ? 'mt-2' : 'mt-0.5')

  return (
    <div className={rowCn}>
      <MessageBubble
        message={row.message}
        isLastInGroup={row.isLastInGroup}
        aside={<MessageSendFailureIcon message={row.message} />}
        footer={<MessageSendFailure message={row.message} />}
      />
    </div>
  )
}

type FeedContentProps = {
  rows: readonly MessageRow[]
}

function FeedContent({ rows }: FeedContentProps) {
  if (rows.length === 0) {
    return (
      <p className="m-auto rounded-full bg-date-pill px-4 py-2 typo-detail text-secondary">
        Напишите первое сообщение
      </p>
    )
  }
  return rows.map((row) => <FeedRow key={row.key} row={row} />)
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

export function MessageFeed({ chatId }: MessageFeedProps) {
  const messages = useChatMessages(chatId)
  const now = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessage = messages.at(-1)
  const lastOutgoingId = lastMessage?.direction === 'outgoing' ? lastMessage.id : null
  const lastIncomingId = lastMessage?.direction === 'incoming' ? lastMessage.id : null
  const incomingCount = countIncoming(messages)

  // Число входящих в момент, когда пользователь ушёл от низа ленты; null — он внизу.
  const [incomingWhenAway, setIncomingWhenAway] = useState<number | null>(null)
  const isAwayRef = useRef(false)
  const seenIncomingIdRef = useRef(lastIncomingId)
  const isAway = incomingWhenAway !== null
  const newCount = isAway ? incomingCount - incomingWhenAway : 0
  const hasNewMessages = newCount > 0

  // Открытие чата — сразу внизу, до первого кадра, без анимации.
  useLayoutEffect(() => {
    const feed = scrollRef.current
    if (feed) feed.scrollTop = feed.scrollHeight
  }, [chatId])

  // Своя отправка — плавно к новому сообщению.
  useEffect(() => {
    const feed = scrollRef.current
    if (!feed || lastOutgoingId === null) return
    scrollToBottom(feed)
  }, [lastOutgoingId])

  // Новое входящее: пользователь внизу — плавно к нему; листает историю — лента не прыгает, растёт счётчик кнопки.
  useEffect(() => {
    const feed = scrollRef.current
    if (!feed || lastIncomingId === null || lastIncomingId === seenIncomingIdRef.current) return
    seenIncomingIdRef.current = lastIncomingId
    if (!isAwayRef.current) scrollToBottom(feed)
  }, [lastIncomingId])

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
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        onScroll={handleScroll}
      >
        <div
          className="mx-auto flex w-full max-w-(--chat-content-max-w) flex-1 flex-col px-3 pt-3 pb-2 md:px-4 md:pt-4"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Сообщения"
        >
          <FeedContent rows={rows} />
        </div>
      </div>
      <Gate when={hasNewMessages}>
        <NewMessagesButton count={newCount} onClick={handleScrollDown} />
      </Gate>
    </div>
  )
}
