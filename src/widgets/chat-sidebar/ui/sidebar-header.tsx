import type { ReactNode } from 'react'

import { Server } from 'lucide-react'

type SidebarHeaderProps = {
  subtitle: string
  actions: ReactNode
}

export function SidebarHeader({ subtitle, actions }: SidebarHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-divider-soft bg-primary pr-2 pl-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tertiary text-icon-secondary">
        <Server className="size-5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="typo-title text-primary">Чаты</h1>
        <p className="truncate typo-description text-tertiary">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center">{actions}</div>
    </header>
  )
}
