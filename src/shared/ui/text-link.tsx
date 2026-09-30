import type { ComponentProps } from 'react'

import { ExternalLink } from 'lucide-react'

import { cn } from '../lib/cn'

import { Gate } from './gate'

type TextLinkProps = ComponentProps<'a'> & {
  external?: boolean
}

const EXTERNAL_ATTRS = { target: '_blank', rel: 'noopener noreferrer' } as const

export function TextLink({ external = false, className, children, ...props }: TextLinkProps) {
  const externalAttrs = external ? EXTERNAL_ATTRS : {}
  const rootCn = cn(
    'inline-flex items-center gap-1 typo-action-small text-link hover:underline',
    className,
  )

  return (
    <a className={rootCn} {...externalAttrs} {...props}>
      {children}
      <Gate when={external}>
        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      </Gate>
    </a>
  )
}
