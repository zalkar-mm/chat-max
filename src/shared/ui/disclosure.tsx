import type { ReactNode } from 'react'

import { ChevronDown } from 'lucide-react'
import { Collapsible } from 'radix-ui'

type DisclosureProps = {
  label: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export function Disclosure({ label, children, open, onOpenChange, defaultOpen }: DisclosureProps) {
  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <Collapsible.Trigger className="group inline-flex h-10 cursor-pointer items-center gap-1 typo-action-small text-link">
        {label}
        <ChevronDown
          className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-2">{children}</Collapsible.Content>
    </Collapsible.Root>
  )
}
