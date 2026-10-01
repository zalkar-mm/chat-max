import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import { useIsSessionExpired } from '@/entities/session/model/session.store'

import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/shared/lib/use-media-query'

import {
  EMPTY_SIGN_IN_VALUES,
  type SignInInput,
  signInSchema,
  type SignInValues,
} from './sign-in.schema'
import { SIGN_IN_ERROR_TEXT } from './sign-in-errors'
import { clearSignInError, submitSignIn } from './sign-in-flow'
import { useSignInFlowStore } from './sign-in-flow.store'

export function useSignInForm() {
  const step = useSignInFlowStore((state) => state.step)
  const draft = useSignInFlowStore((state) => state.draft)
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const hasSessionExpired = useIsSessionExpired()
  const [shouldFocusOnOpen] = useState(isDesktop)
  const [isAdvancedToggled, setAdvancedToggled] = useState(false)

  const form = useForm<SignInInput, unknown, SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: draft ?? EMPTY_SIGN_IN_VALUES,
  })
  const { errors } = form.formState

  // Фокус в первое поле — только на desktop: на мобильном не выбрасываем клавиатуру.
  useEffect(() => {
    if (shouldFocusOnOpen) form.setFocus('idInstance')
  }, [form, shouldFocusOnOpen])

  const [idInstance, apiTokenInstance, remember] = useWatch({
    control: form.control,
    name: ['idInstance', 'apiTokenInstance', 'remember'],
  })

  const formStep = step.kind === 'form' ? step : null
  const isChecking = formStep?.isChecking ?? false
  const serverError = formStep?.error ? SIGN_IN_ERROR_TEXT[formStep.error] : null
  // «Истекла» — и при восстановлении сессии, и когда цикл получения получил 401 посреди работы.
  const isSessionExpired = (formStep?.isSessionExpired ?? false) || hasSessionExpired
  const isSubmitDisabled = idInstance.trim() === '' || apiTokenInstance.trim() === ''
  const isAdvancedOpen = isAdvancedToggled || errors.apiUrl !== undefined

  const idInstanceField = form.register('idInstance', {
    onBlur: (event: { target: { value: string } }) => {
      form.setValue('idInstance', event.target.value.trim(), { shouldValidate: true })
    },
  })
  const apiTokenField = form.register('apiTokenInstance')
  const apiUrlField = form.register('apiUrl')

  const handleSubmit = form.handleSubmit((values) => submitSignIn(values))

  const handleRememberChange = (checked: boolean) => {
    form.setValue('remember', checked)
    clearSignInError()
  }

  return {
    idInstanceField,
    apiTokenField,
    apiUrlField,
    errors: {
      idInstance: errors.idInstance?.message,
      apiTokenInstance: errors.apiTokenInstance?.message,
      apiUrl: errors.apiUrl?.message,
    },
    remember,
    isAdvancedOpen,
    isChecking,
    isSubmitDisabled,
    isSessionExpired,
    serverError,
    onSubmit: handleSubmit,
    onChange: clearSignInError,
    onRememberChange: handleRememberChange,
    onAdvancedOpenChange: setAdvancedToggled,
  }
}

export type SignInFormModel = ReturnType<typeof useSignInForm>
