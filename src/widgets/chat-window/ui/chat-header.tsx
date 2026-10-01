import { ArrowLeft } from 'lucide-react'

import { ChatAvatar } from '@/entities/chat/ui/chat-avatar'

import { IconButton } from '@/shared/ui/icon-button'

type ChatHeaderProps = {
  chatId: string
  title: string
  onBack: () => void
}

export function ChatHeader({ chatId, title, onBack }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-divider-soft bg-primary pr-4 pl-1 md:pl-4">
      <IconButton label="Назад к списку" className="md:hidden" onClick={onBack}>
        <ArrowLeft aria-hidden />
      </IconButton>
      <ChatAvatar chatId={chatId} size={36} />
      <h2 className="min-w-0 flex-1 truncate typo-title text-primary">{title}</h2>
    </header>
  )
}
