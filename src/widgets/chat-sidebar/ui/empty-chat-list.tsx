import type { ReactNode } from 'react'

import { MessagesSquare } from 'lucide-react'

type EmptyChatListProps = {
  action: ReactNode
}

export function EmptyChatList({ action }: EmptyChatListProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex max-w-70 flex-col items-center">
        <MessagesSquare className="size-12 text-icon-tertiary" aria-hidden />
        <p className="mt-4 typo-body-strong text-primary">Здесь появятся ваши чаты</p>
        <p className="mt-1 typo-detail text-secondary">Начните переписку по номеру телефона</p>
        <div className="mt-4">{action}</div>
      </div>
    </div>
  )
}
