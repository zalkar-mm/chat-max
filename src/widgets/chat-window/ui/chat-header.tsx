import { ArrowLeft } from 'lucide-react'

import { formatPhone } from '@/entities/chat/lib/phone'
import { ChatAvatar } from '@/entities/chat/ui/chat-avatar'

import { Gate } from '@/shared/ui/gate'
import { IconButton } from '@/shared/ui/icon-button'

type ChatHeaderProps = {
  chatId: string
  title: string
  /** Имя собеседника: есть — шапка двухстрочная, под именем номер. */
  name: string | null
  phone: string | null
  onBack: () => void
}

export function ChatHeader({ chatId, title, name, phone, onBack }: ChatHeaderProps) {
  const hasSubtitle = name !== null && phone !== null
  const subtitle = phone === null ? '' : formatPhone(phone)

  return (
    <header className="flex h-[calc(var(--s-56)+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b border-divider-soft bg-primary pt-[env(safe-area-inset-top)] pr-4 pl-1 narrow:pr-3 md:pl-4 phone-landscape:h-12">
      <IconButton label="Назад к списку" className="md:hidden" onClick={onBack}>
        <ArrowLeft aria-hidden />
      </IconButton>
      <ChatAvatar chatId={chatId} size={36} name={name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="truncate typo-title text-primary">{title}</h2>
        <Gate when={hasSubtitle}>
          <p className="truncate typo-description text-tertiary">{subtitle}</p>
        </Gate>
      </div>
    </header>
  )
}
