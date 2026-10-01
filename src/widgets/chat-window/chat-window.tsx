import { Navigate, useNavigate } from 'react-router'

import { MessageComposer } from '@/features/send-message/message-composer'

import { useChat } from '@/entities/chat/model/chat.store'

import { ROUTES } from '@/shared/consts/routes'

import { ChatHeader } from './ui/chat-header'
import { MessageFeed } from './ui/message-feed'

type ChatWindowProps = {
  chatId: string
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const navigate = useNavigate()
  const chat = useChat(chatId)

  // Чаты живут до перезагрузки (история — спринт 3): неизвестный чат в URL ведёт к списку.
  if (!chat) return <Navigate to={ROUTES.CHATS} replace />

  const handleBack = () => {
    void navigate(ROUTES.CHATS)
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-chat" aria-label={chat.title}>
      <ChatHeader chatId={chat.id} title={chat.title} onBack={handleBack} />
      <MessageFeed chatId={chat.id} />
      <MessageComposer chatId={chat.id} />
    </section>
  )
}
