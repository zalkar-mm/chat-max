import { useParams } from 'react-router'

import { ChatSidebar } from '@/widgets/chat-sidebar/chat-sidebar'
import { ChatWindow } from '@/widgets/chat-window/chat-window'
import { NoChatSelected } from '@/widgets/chat-window/ui/no-chat-selected'
import { StatusBanners } from '@/widgets/status-banners/status-banners'

import { NewChatDialog } from '@/features/create-chat/new-chat-dialog'

import { cn } from '@/shared/lib/cn'

type ChatPanelProps = {
  chatId: string | null
}

function ChatPanel({ chatId }: ChatPanelProps) {
  if (chatId === null) return <NoChatSelected />
  return <ChatWindow key={chatId} chatId={chatId} />
}

/**
 * Desktop — две колонки. Mobile — список или чат (master-detail по URL).
 * Список на mobile скрывается, а не размонтируется: при «Назад» его прокрутка сохраняется.
 */
export function ChatsPage() {
  const { chatId = null } = useParams()
  const isChatOpen = chatId !== null

  const sidebarCn = cn(
    'min-h-0 min-w-0 flex-col bg-primary md:flex md:border-r md:border-divider-soft',
    isChatOpen ? 'hidden' : 'flex',
  )
  const mainCn = cn('min-h-0 min-w-0 md:block', isChatOpen ? 'block' : 'hidden')

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <title>MAX-чат</title>
      <StatusBanners />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[var(--sidebar-w-narrow)_minmax(0,1fr)] xl:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <ChatSidebar selectedChatId={chatId} className={sidebarCn} />
        <main className={mainCn}>
          <ChatPanel chatId={chatId} />
        </main>
      </div>
      <NewChatDialog />
    </div>
  )
}
