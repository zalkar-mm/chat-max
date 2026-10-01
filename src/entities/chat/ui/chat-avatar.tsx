import { User } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Gate } from '@/shared/ui/gate'

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

const INITIAL_CLASS: Record<AvatarSize, string> = {
  36: 'typo-body-strong',
  48: 'typo-title',
}

export type ChatAvatarProps = {
  chatId: string
  size: AvatarSize
  /** Имя собеседника: есть — показываем инициал вместо иконки. */
  name?: string | null
}

const toInitial = (name: string | null) => {
  const letter = name?.trim().charAt(0) ?? ''
  return letter.toLocaleUpperCase('ru-RU')
}

export function ChatAvatar({ chatId, size, name = null }: ChatAvatarProps) {
  const initial = toInitial(name)
  const hasInitial = initial !== ''
  const rootCn = cn(
    'flex shrink-0 items-center justify-center rounded-full text-white',
    SIZE_CLASS[size],
    TONE_CLASS[getAvatarTone(chatId)],
  )

  return (
    <span className={rootCn} aria-hidden>
      <Gate when={hasInitial} fallback={<User className={ICON_CLASS[size]} />}>
        <span className={INITIAL_CLASS[size]}>{initial}</span>
      </Gate>
    </span>
  )
}
