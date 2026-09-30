import { NewChatIconButton, StartNewChatButton } from '@/features/create-chat/new-chat-buttons'
import { SignOutButton } from '@/features/sign-out/sign-out-button'
import { ThemeToggle } from '@/features/toggle-theme/theme-toggle'

import { useSortedChatIds } from '@/entities/chat/model/chat.store'
import { useSessionIdInstance } from '@/entities/session/model/session.store'

import { useNow } from '@/shared/lib/use-now'

import { ChatListRow } from './ui/chat-list-row'
import { EmptyChatList } from './ui/empty-chat-list'
import { SidebarHeader } from './ui/sidebar-header'

type ChatSidebarProps = {
  selectedChatId: string | null
  className?: string
}

type ChatListProps = {
  selectedChatId: string | null
}

function ChatList({ selectedChatId }: ChatListProps) {
  const chatIds = useSortedChatIds()
  const now = useNow()

  if (chatIds.length === 0) return <EmptyChatList action={<StartNewChatButton />} />

  return (
    <ul className="flex flex-col">
      {chatIds.map((chatId) => (
        <li key={chatId}>
          <ChatListRow chatId={chatId} selectedChatId={selectedChatId} now={now} />
        </li>
      ))}
    </ul>
  )
}

export function ChatSidebar({ selectedChatId, className }: ChatSidebarProps) {
  const idInstance = useSessionIdInstance() ?? ''

  return (
    <aside className={className}>
      <SidebarHeader
        subtitle={idInstance}
        actions={
          <>
            <NewChatIconButton />
            <ThemeToggle />
            <SignOutButton />
          </>
        }
      />
      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Список чатов">
        <ChatList selectedChatId={selectedChatId} />
      </nav>
    </aside>
  )
}
