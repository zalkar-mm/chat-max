import { useNavigate } from 'react-router'

import { useChat } from '@/entities/chat/model/chat.store'
import { ChatListItem, type ChatListItemStatus } from '@/entities/chat/ui/chat-list-item'
import { formatChatListTime } from '@/entities/message/lib/format-chat-list-time'
import { useLastMessage } from '@/entities/message/model/message.store'
import type { Message } from '@/entities/message/model/message.types'

import { ROUTES } from '@/shared/consts/routes'

type ChatListRowProps = {
  chatId: string
  selectedChatId: string | null
  now: number
}

const UNSUPPORTED_PREVIEW = 'Сообщение этого типа не поддерживается'

const toPreviewText = (message: Message) =>
  message.content === 'unsupported' ? UNSUPPORTED_PREVIEW : message.text

const toPreview = (message: Message | null) => {
  if (!message) return null
  if (message.direction === 'outgoing') return `Вы: ${toPreviewText(message)}`
  return toPreviewText(message)
}

const toStatus = (message: Message | null): ChatListItemStatus | null => {
  if (message?.direction !== 'outgoing') return null
  return message.delivery.status
}

export function ChatListRow({ chatId, selectedChatId, now }: ChatListRowProps) {
  const navigate = useNavigate()
  const chat = useChat(chatId)
  const lastMessage = useLastMessage(chatId)
  if (!chat) return null

  const isSelected = chatId === selectedChatId
  const time = lastMessage ? formatChatListTime(lastMessage.createdAt, now) : null

  const handleOpen = (id: string) => {
    void navigate(ROUTES.CHAT(id))
  }

  return (
    <ChatListItem
      chatId={chat.id}
      title={chat.title}
      name={chat.name}
      preview={toPreview(lastMessage)}
      time={time}
      status={toStatus(lastMessage)}
      unreadCount={chat.unreadCount}
      isSelected={isSelected}
      onOpen={handleOpen}
    />
  )
}
