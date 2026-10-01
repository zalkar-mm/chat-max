import { useLayoutEffect, useRef } from 'react'

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
  /** На mobile при открытом чате список скрыт (display: none) — браузер при этом сбрасывает прокрутку. */
  isHidden: boolean
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

/** Запоминает прокрутку списка и возвращает её, когда список снова показан («Назад» на mobile). */
function useScrollRestoration(isHidden: boolean) {
  const listRef = useRef<HTMLElement>(null)
  const savedScrollTop = useRef(0)

  useLayoutEffect(() => {
    if (!isHidden && listRef.current) listRef.current.scrollTop = savedScrollTop.current
  }, [isHidden])

  // Сохраняем только видимую прокрутку: сброс в 0 при display: none запоминать нельзя.
  const handleScroll = () => {
    const list = listRef.current
    if (list?.offsetParent) savedScrollTop.current = list.scrollTop
  }

  return { listRef, handleScroll }
}

export function ChatSidebar({ selectedChatId, isHidden, className }: ChatSidebarProps) {
  const idInstance = useSessionIdInstance() ?? ''
  const { listRef, handleScroll } = useScrollRestoration(isHidden)

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
      {/* id и tabIndex — цель ссылки «Перейти к сообщениям», пока чат не открыт. */}
      <nav
        ref={listRef}
        id="chat-list"
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto p-2 focus-visible:shadow-none"
        aria-label="Чаты"
        onScroll={handleScroll}
      >
        <ChatList selectedChatId={selectedChatId} />
      </nav>
    </aside>
  )
}
