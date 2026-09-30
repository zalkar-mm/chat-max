import { NewChatIconButton, StartNewChatButton } from '@/features/create-chat/new-chat-buttons'
import { SignOutButton } from '@/features/sign-out/sign-out-button'
import { ThemeToggle } from '@/features/toggle-theme/theme-toggle'

import { useSessionIdInstance } from '@/entities/session/model/session.store'

import { EmptyChatList } from './ui/empty-chat-list'
import { SidebarHeader } from './ui/sidebar-header'

export function ChatSidebar() {
  const idInstance = useSessionIdInstance() ?? ''

  return (
    <aside className="flex min-h-0 min-w-0 flex-col bg-primary md:border-r md:border-divider-soft">
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
        <EmptyChatList action={<StartNewChatButton />} />
      </nav>
    </aside>
  )
}
