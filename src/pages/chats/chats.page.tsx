import { useParams } from 'react-router'

import { ChatSidebar } from '@/widgets/chat-sidebar/chat-sidebar'
import { UnreadTitle } from '@/widgets/chat-sidebar/unread-title'
import { ChatWindow } from '@/widgets/chat-window/chat-window'
import { NoChatSelected } from '@/widgets/chat-window/no-chat-selected'
import { StatusBanners } from '@/widgets/status-banners/status-banners'

import { NewChatDialog } from '@/features/create-chat/new-chat-dialog'

import { cn } from '@/shared/lib/cn'
import { SkipLink } from '@/shared/ui/skip-link'

type ChatPanelProps = {
  chatId: string | null
}

function ChatPanel({ chatId }: ChatPanelProps) {
  if (chatId === null) return <NoChatSelected />
  return <ChatWindow key={chatId} chatId={chatId} />
}

/**
 * Desktop — две колонки. Mobile — список или чат (master-detail по URL).
 * Список на mobile скрывается, а не размонтируется; прокрутку при «Назад» возвращает сам сайдбар.
 */
export function ChatsPage() {
  const { chatId = null } = useParams()
  const isChatOpen = chatId !== null

  const sidebarCn = cn(
    'min-h-0 min-w-0 flex-col bg-primary md:flex md:border-r md:border-divider-soft',
    isChatOpen ? 'hidden' : 'flex',
  )
  const mainCn = cn('min-h-0 min-w-0 md:block', isChatOpen ? 'block' : 'hidden')

  // Пропуск навигации: к ленте открытого чата, иначе — к списку.
  const skipTarget = isChatOpen ? 'messages' : 'chat-list'

  return (
    <div className="flex h-dvh flex-col bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <SkipLink targetId={skipTarget}>Перейти к сообщениям</SkipLink>
      <h1 className="sr-only">MAX-чат</h1>
      <UnreadTitle />
      <StatusBanners />
      {/* main — вся рабочая область: на mobile видна одна из колонок, а landmark должен быть всегда. */}
      <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[var(--sidebar-w-narrow)_minmax(0,1fr)] xl:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <ChatSidebar selectedChatId={chatId} isHidden={isChatOpen} className={sidebarCn} />
        <div className={mainCn}>
          <ChatPanel chatId={chatId} />
        </div>
      </main>
      <NewChatDialog />
    </div>
  )
}
