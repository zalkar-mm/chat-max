import {
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'

import { setChatDraft, useChatDraft } from '@/entities/chat/model/chat.store'
import { MAX_MESSAGE_LENGTH } from '@/entities/message/model/message-limits'
import { isUsableInstanceState } from '@/entities/session/model/instance-state'
import { useInstanceState } from '@/entities/session/model/session.store'

import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/shared/lib/use-media-query'

import { sendMessage } from './send-queue'

export const COUNTER_THRESHOLD = 3800

export function useComposer(chatId: string, textareaRef: RefObject<HTMLTextAreaElement | null>) {
  const text = useChatDraft(chatId)
  const instanceState = useInstanceState()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const [shouldAutoFocus] = useState(isDesktop)

  const length = Array.from(text).length
  const isOverLimit = length > MAX_MESSAGE_LENGTH
  const isBlank = text.trim() === ''
  const isInstanceReady = instanceState === null || isUsableInstanceState(instanceState)
  const canSend = isInstanceReady && !isBlank && !isOverLimit

  // Автовысота: поле растёт под текст до 6 строк, дальше — прокрутка внутри.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    // Предел высоты (6 строк, в альбомной — 3) задаёт CSS поля ввода.
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [text, textareaRef])

  // Автофокус при открытии чата — только desktop: на мобильном не выбрасываем клавиатуру.
  useEffect(() => {
    if (shouldAutoFocus) textareaRef.current?.focus()
  }, [chatId, shouldAutoFocus, textareaRef])

  const send = () => {
    if (!canSend) return
    sendMessage(chatId, text)
    setChatDraft(chatId, '')
    textareaRef.current?.focus()
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setChatDraft(chatId, event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // keyCode 229 — Safari подтверждает IME-ввод Enter-ом с isComposing: false.
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229
    if (event.key !== 'Enter' || event.shiftKey || isComposing) return
    event.preventDefault()
    send()
  }

  return {
    text,
    length,
    isOverLimit,
    isCounterVisible: length >= COUNTER_THRESHOLD,
    isInstanceReady,
    canSend,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onSend: send,
  }
}

export type ComposerModel = ReturnType<typeof useComposer>
