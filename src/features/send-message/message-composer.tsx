import { useRef } from 'react'

import { useComposer } from './model/use-composer'
import { Composer } from './ui/composer'

type MessageComposerProps = {
  chatId: string
}

export function MessageComposer({ chatId }: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const model = useComposer(chatId, textareaRef)
  return <Composer model={model} textareaRef={textareaRef} />
}
