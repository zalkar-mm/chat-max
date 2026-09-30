import { GREEN_API_CONSOLE_URL } from '@/shared/config/env'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

import type { FailureText } from '../model/create-chat-errors'
import type { CreateChatFormModel } from '../model/use-create-chat-form'

type CreateChatFormProps = {
  model: CreateChatFormModel
  onCancel: () => void
}

const FIELD_ID = 'new-chat-phone'
const HINT = 'Россия (+7) или Беларусь (+375)'

type FailureMessageProps = {
  failure: FailureText
}

function FailureMessage({ failure }: FailureMessageProps) {
  if (failure.consoleLink === null) return failure.text

  return (
    <>
      {failure.text}
      <a
        className="text-link underline"
        href={GREEN_API_CONSOLE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {failure.consoleLink.label}
      </a>
      {failure.consoleLink.after}
    </>
  )
}

type ErrorMessageProps = {
  fieldError: string | null
  failure: FailureText | null
}

function ErrorMessage({ fieldError, failure }: ErrorMessageProps) {
  if (fieldError !== null) return fieldError
  if (failure !== null) return <FailureMessage failure={failure} />
  return null
}

export function CreateChatForm({ model, onCancel }: CreateChatFormProps) {
  const { fieldError, failureText, isChecking } = model
  const hasError = fieldError !== null || failureText !== null
  const errorId = `${FIELD_ID}-error`
  const hintId = `${FIELD_ID}-hint`
  const describedBy = hasError ? errorId : hintId
  const hint = hasError ? undefined : HINT
  const submitText = isChecking ? 'Ищем в MAX…' : 'Создать чат'

  return (
    <form className="flex flex-1 flex-col" noValidate onSubmit={model.onSubmit}>
      <Field id={FIELD_ID} label="Номер телефона" hint={hint}>
        <Input
          id={FIELD_ID}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="+7 999 123-45-67"
          disabled={isChecking}
          invalid={hasError}
          aria-describedby={describedBy}
          {...model.phoneField}
        />
      </Field>
      <p
        id={errorId}
        role="alert"
        className="mt-1.5 typo-description text-negative-strong empty:hidden"
      >
        <ErrorMessage fieldError={fieldError} failure={failureText} />
      </p>

      <div className="mt-auto flex gap-2 pt-6 pb-[max(16px,env(safe-area-inset-bottom))] md:mt-0 md:pb-0">
        <Button
          variant="secondary"
          className="hidden flex-1 md:inline-flex"
          disabled={isChecking}
          onClick={onCancel}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={isChecking}
          disabled={model.isSubmitDisabled}
        >
          {submitText}
        </Button>
      </div>
    </form>
  )
}
