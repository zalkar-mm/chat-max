import { ArrowDown } from 'lucide-react'

import { pluralize } from '@/shared/lib/plural'
import { Gate } from '@/shared/ui/gate'
import { IconButton } from '@/shared/ui/icon-button'

const MAX_COUNT = 99

const NEW_MESSAGE_FORMS = ['новое сообщение', 'новых сообщения', 'новых сообщений'] as const

type NewMessagesButtonProps = {
  /** Новые сообщения с момента, как пользователь ушёл от низа ленты; 0 — без бейджа. */
  count: number
  onClick: () => void
}

/** Круглая кнопка «↓» над composer: прокрутка ленты вниз к новым сообщениям. */
export function NewMessagesButton({ count, onClick }: NewMessagesButtonProps) {
  const hasCount = count > 0
  const countLabel = count > MAX_COUNT ? `${MAX_COUNT}+` : String(count)
  const countText = `${countLabel} ${pluralize(count, NEW_MESSAGE_FORMS)}`
  const label = hasCount ? `${countText}, прокрутить вниз` : 'Прокрутить вниз'

  return (
    <IconButton
      label={label}
      title="Новые сообщения"
      className="absolute right-3 bottom-4 animate-appear-fast rounded-full bg-scroll-fab text-icon-primary shadow-scroll-fab enabled:hover:bg-cell-hover enabled:active:scale-96 md:right-4"
      onClick={onClick}
    >
      <ArrowDown aria-hidden />
      <Gate when={hasCount}>
        <span
          className="absolute -top-1.5 left-1/2 flex h-5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full bg-counter px-1.5 typo-label font-medium text-counter tabular-nums"
          aria-hidden
        >
          {countLabel}
        </span>
      </Gate>
    </IconButton>
  )
}
