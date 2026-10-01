import type { ComponentProps, MouseEvent } from 'react'

import { cn } from '../lib/cn'

type SkipLinkProps = Omit<ComponentProps<'a'>, 'href' | 'onClick' | 'children'> & {
  children: string
  /** id цели без «#»; у цели должен быть tabIndex={-1}. */
  targetId: string
}

/**
 * Ссылка пропуска навигации (DS §2): первая по Tab, видна только в фокусе.
 * Фокус переводим сами: переход по якорю добавил бы запись в историю роутера.
 */
export function SkipLink({ targetId, className, children, ...props }: SkipLinkProps) {
  const rootCn = cn(
    'fixed top-2 left-2 z-[1000] -translate-y-[200%] rounded-s bg-(--skip-link-bg) px-3 py-2 typo-action-small text-(--skip-link-fg) shadow-scroll-fab',
    'focus-visible:translate-y-0',
    className,
  )

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    document.getElementById(targetId)?.focus()
  }

  return (
    <a href={`#${targetId}`} className={rootCn} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
