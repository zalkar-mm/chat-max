import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'

import { checkAccount } from '@/entities/chat/api/check-account'
import { normalizePhone } from '@/entities/chat/lib/phone'
import { addChat, findChatIdByPhone } from '@/entities/chat/model/chat.store'
import { checkInstanceState } from '@/entities/session/api/check-instance-state'
import { getSessionCredentials, useSessionStore } from '@/entities/session/model/session.store'

import { toApiError } from '@/shared/api/api-error'
import type { Credentials } from '@/shared/api/credentials'
import { ROUTES } from '@/shared/consts/routes'

import { createChatSchema, type CreateChatValues } from './create-chat.schema'
import {
  CREATE_CHAT_FAILURE_TEXT,
  type CreateChatFailure,
  toCreateChatFailure,
} from './create-chat-errors'
import {
  closeNewChatDialogWithoutFocusReturn,
  handOverDialogHistoryEntry,
  useNewChatDialogStore,
} from './new-chat-dialog.store'

/** Инстанс «не готов» по ответу checkAccount — актуализируем его статус для остального UI. */
function refreshInstanceState(credentials: Credentials) {
  checkInstanceState(credentials)
    .then((state) => {
      useSessionStore.getState().setInstanceState(state)
    })
    .catch(() => undefined)
}

export function useCreateChatForm() {
  const navigate = useNavigate()
  const [failure, setFailure] = useState<CreateChatFailure | null>(null)

  const form = useForm<CreateChatValues>({
    resolver: zodResolver(createChatSchema),
    mode: 'onSubmit',
    defaultValues: { phone: '' },
  })

  const openChat = (chatId: string) => {
    // Запись формы в истории заменяем чатом: «Назад» из чата — к списку, а не в закрытую форму.
    const replace = handOverDialogHistoryEntry()
    closeNewChatDialogWithoutFocusReturn()
    void navigate(ROUTES.CHAT(chatId), { replace })
  }

  const lookup = useMutation({
    mutationFn: ({ credentials, phone }: { credentials: Credentials; phone: string }) =>
      checkAccount(credentials, phone),
    onSuccess: (result, { phone }) => {
      if (!result.exists) {
        setFailure('notFound')
        return
      }
      // Форму закрыли «Назад», пока шла проверка: пользователь передумал — чат не создаём.
      if (!useNewChatDialogStore.getState().isOpen) return
      // Чат с этим chatId уже мог быть создан по другому написанию номера — addChat вернёт его.
      const chat = addChat({ chatId: result.chatId, phone, now: Date.now() })
      openChat(chat.id)
    },
    onError: (error, { credentials }) => {
      const next = toCreateChatFailure(toApiError(error).kind)
      if (next === 'instanceNotReady') refreshInstanceState(credentials)
      setFailure(next)
    },
  })
  const isChecking = lookup.isPending

  // Поле на время проверки неактивно и теряет фокус — после ответа с ошибкой возвращаем его в поле.
  useEffect(() => {
    if (failure !== null && !isChecking) form.setFocus('phone')
  }, [failure, isChecking, form])

  const handleSubmit = form.handleSubmit(({ phone }) => {
    if (lookup.isPending) return
    const digits = normalizePhone(phone)
    const existingChatId = findChatIdByPhone(digits)
    if (existingChatId !== null) {
      openChat(existingChatId)
      return
    }
    const credentials = getSessionCredentials()
    if (!credentials) return
    lookup.mutate({ credentials, phone: digits })
  })

  const phoneField = form.register('phone', {
    onChange: () => {
      setFailure(null)
    },
    // При уходе из поля проверяем формат только непустого номера.
    onBlur: (event: { target: { value: string } }) => {
      if (event.target.value.trim() !== '') void form.trigger('phone')
    },
  })

  const phone = useWatch({ control: form.control, name: 'phone' })
  const fieldError = form.formState.errors.phone?.message
  const failureText = failure === null ? null : CREATE_CHAT_FAILURE_TEXT[failure]

  // Фокус сразу в поле номера (а не на «×», первый элемент модалки), в том числе на mobile — нужна клавиатура.
  const handleOpenAutoFocus = (event: Event) => {
    event.preventDefault()
    form.setFocus('phone')
  }

  return {
    phoneField,
    fieldError: fieldError ?? null,
    failureText,
    isChecking,
    isSubmitDisabled: phone.trim() === '',
    onSubmit: handleSubmit,
    onOpenAutoFocus: handleOpenAutoFocus,
  }
}

export type CreateChatFormModel = ReturnType<typeof useCreateChatForm>
