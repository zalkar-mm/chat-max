import { ChatSidebar } from '@/widgets/chat-sidebar/chat-sidebar'
import { NoChatSelected } from '@/widgets/chat-window/ui/no-chat-selected'
import { StatusBanners } from '@/widgets/status-banners/status-banners'

import { NewChatDialog } from '@/features/create-chat/new-chat-dialog'

export function ChatsPage() {
  return (
    <div className="flex h-dvh flex-col bg-surface">
      <title>MAX-чат</title>
      <StatusBanners />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[var(--sidebar-w-narrow)_minmax(0,1fr)] xl:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <ChatSidebar />
        <main className="hidden min-h-0 min-w-0 md:block">
          <NoChatSelected />
        </main>
      </div>
      <NewChatDialog />
    </div>
  )
}
