import { User } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

import { type AvatarTone, getAvatarTone } from '../lib/avatar-tone'

const TONE_CLASS: Record<AvatarTone, string> = {
  sky: 'bg-avatar-sky',
  violet: 'bg-avatar-violet',
  coral: 'bg-avatar-coral',
  green: 'bg-avatar-green',
  orange: 'bg-avatar-orange',
}

type AvatarSize = 36 | 48

const SIZE_CLASS: Record<AvatarSize, string> = {
  36: 'size-9',
  48: 'size-12',
}

const ICON_CLASS: Record<AvatarSize, string> = {
  36: 'size-5',
  48: 'size-6',
}

export type ChatAvatarProps = {
  chatId: string
  size: AvatarSize
}

export function ChatAvatar({ chatId, size }: ChatAvatarProps) {
  const rootCn = cn(
    'flex shrink-0 items-center justify-center rounded-full text-white',
    SIZE_CLASS[size],
    TONE_CLASS[getAvatarTone(chatId)],
  )

  return (
    <span className={rootCn} aria-hidden>
      <User className={ICON_CLASS[size]} />
    </span>
  )
}
