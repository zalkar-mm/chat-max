import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// typo-* — наши утилиты шрифта (src/app/styles/index.css): последняя из них должна побеждать.
const twMerge = extendTailwindMerge<'typo'>({
  extend: {
    classGroups: {
      typo: [{ typo: [(value: string) => value.length > 0] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
