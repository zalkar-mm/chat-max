import { useEffect, useLayoutEffect, useRef } from 'react'

import {
  MessageSendFailure,
  MessageSendFailureIcon,
} from '@/features/send-message/message-send-failure'

import { buildMessageRows, type MessageRow } from '@/entities/message/lib/group-messages'
import { useChatMessages } from '@/entities/message/model/message.store'
import { DayDivider } from '@/entities/message/ui/day-divider'
import { MessageBubble } from '@/entities/message/ui/message-bubble'

import { cn } from '@/shared/lib/cn'
import { useNow } from '@/shared/lib/use-now'

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

function EmptyFeed() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <p className="rounded-full bg-date-pill px-4 py-2 typo-detail text-secondary">
        Напишите первое сообщение
      </p>
    </div>
  )
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function MessageFeed({ chatId }: MessageFeedProps) {
  const messages = useChatMessages(chatId)
  const now = useNow()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessage = messages.at(-1)
  const lastOutgoingId = lastMessage?.direction === 'outgoing' ? lastMessage.id : null

  // Открытие чата — сразу внизу, до первого кадра, без анимации.
  useLayoutEffect(() => {
    const feed = scrollRef.current
    if (feed) feed.scrollTop = feed.scrollHeight
  }, [chatId])

  // Своя отправка — плавно к новому сообщению.
  useEffect(() => {
    const feed = scrollRef.current
    if (!feed || lastOutgoingId === null) return
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
    feed.scrollTo({ top: feed.scrollHeight, behavior })
  }, [lastOutgoingId])

  if (messages.length === 0) return <EmptyFeed />

  const rows = buildMessageRows(messages, now)

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      <div
        className="mx-auto max-w-(--chat-content-max-w) px-3 pt-3 pb-2 md:px-4 md:pt-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Сообщения"
      >
        {rows.map((row) => (
          <FeedRow key={row.key} row={row} />
        ))}
      </div>
    </div>
  )
}
