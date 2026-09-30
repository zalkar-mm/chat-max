import { GREEN_API_CONSOLE_URL } from '@/shared/config/env'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Disclosure } from '@/shared/ui/disclosure'
import { Field, getFieldDescribedBy } from '@/shared/ui/field'
import { Gate } from '@/shared/ui/gate'
import { InlineAlert } from '@/shared/ui/inline-alert'
import { Input } from '@/shared/ui/input'
import { Logo } from '@/shared/ui/logo'
import { SecretInput } from '@/shared/ui/secret-input'
import { TextLink } from '@/shared/ui/text-link'

import type { SignInFormModel } from '../model/use-sign-in-form'

type SignInFormProps = {
  model: SignInFormModel
}

const ID_INSTANCE_HINT = 'Номер инстанса из личного кабинета GREEN-API'
const API_URL_HINT = 'Адрес сервера инстанса. Обычно менять не нужно'

export function SignInForm({ model }: SignInFormProps) {
  const { errors, isChecking } = model
  const idInstanceDescribedBy = getFieldDescribedBy('idInstance', {
    hint: ID_INSTANCE_HINT,
    error: errors.idInstance,
  })
  const tokenDescribedBy = getFieldDescribedBy('apiTokenInstance', {
    error: errors.apiTokenInstance,
  })
  const apiUrlDescribedBy = getFieldDescribedBy('apiUrl', {
    hint: API_URL_HINT,
    error: errors.apiUrl,
  })
  const submitText = isChecking ? 'Проверяем…' : 'Войти'
  const hasServerError = model.serverError !== null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-4 typo-hero text-primary">Вход</h1>
        <p className="mt-2 typo-body text-secondary">Войдите с данными инстанса GREEN-API</p>
      </header>

      <Gate when={model.isSessionExpired}>
        <InlineAlert tone="info">Сессия недействительна, войдите снова</InlineAlert>
      </Gate>

      <form
        className="flex flex-col"
        noValidate
        onSubmit={model.onSubmit}
        onChange={model.onChange}
        aria-busy={isChecking}
      >
        <fieldset className="flex min-w-0 flex-col gap-4" disabled={isChecking}>
          <Field
            id="idInstance"
            label="idInstance"
            hint={ID_INSTANCE_HINT}
            error={errors.idInstance}
          >
            <Input
              id="idInstance"
              inputMode="numeric"
              autoComplete="off"
              invalid={errors.idInstance !== undefined}
              aria-describedby={idInstanceDescribedBy}
              {...model.idInstanceField}
            />
          </Field>

          <Field id="apiTokenInstance" label="apiTokenInstance" error={errors.apiTokenInstance}>
            <SecretInput
              id="apiTokenInstance"
              autoComplete="off"
              spellCheck={false}
              showLabel="Показать токен"
              hideLabel="Скрыть токен"
              invalid={errors.apiTokenInstance !== undefined}
              aria-describedby={tokenDescribedBy}
              {...model.apiTokenField}
            />
          </Field>

          <Disclosure
            label="Дополнительно"
            open={model.isAdvancedOpen}
            onOpenChange={model.onAdvancedOpenChange}
          >
            <Field id="apiUrl" label="API URL" hint={API_URL_HINT} error={errors.apiUrl}>
              <Input
                id="apiUrl"
                type="url"
                autoComplete="off"
                spellCheck={false}
                invalid={errors.apiUrl !== undefined}
                aria-describedby={apiUrlDescribedBy}
                {...model.apiUrlField}
              />
            </Field>
          </Disclosure>

          <Checkbox
            id="remember"
            checked={model.remember}
            onCheckedChange={model.onRememberChange}
            label="Запомнить меня"
            hint="Не включайте на чужом компьютере"
            disabled={isChecking}
          />
        </fieldset>

        <Gate when={hasServerError}>
          <div className="mt-6">
            <InlineAlert tone="error">{model.serverError}</InlineAlert>
          </div>
        </Gate>

        <Button
          type="submit"
          className="mt-6 w-full"
          loading={isChecking}
          disabled={model.isSubmitDisabled}
        >
          {submitText}
        </Button>
      </form>

      <TextLink href={GREEN_API_CONSOLE_URL} external className="-mt-2 self-center">
        Где взять idInstance и токен?
      </TextLink>
    </div>
  )
}
