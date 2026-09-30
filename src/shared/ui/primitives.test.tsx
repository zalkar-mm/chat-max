import { useState } from 'react'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'
import { Checkbox } from './checkbox'
import { Disclosure } from './disclosure'
import { Field, getFieldDescribedBy } from './field'
import { Gate } from './gate'
import { Input } from './input'
import { SecretInput } from './secret-input'

function ControlledCheckbox() {
  const [checked, setChecked] = useState(false)

  return (
    <Checkbox
      id="remember"
      checked={checked}
      onCheckedChange={setChecked}
      label="Запомнить меня"
      hint="Не включайте на чужом компьютере"
    />
  )
}

type FieldHarnessProps = {
  hint?: string
  error?: string
}

function FieldHarness({ hint, error }: FieldHarnessProps) {
  const describedBy = getFieldDescribedBy('instance', { hint, error })

  return (
    <Field id="instance" label="idInstance" hint={hint} error={error}>
      <Input id="instance" aria-describedby={describedBy} invalid={Boolean(error)} />
    </Field>
  )
}

describe('Button', () => {
  it('в состоянии loading заблокирована, помечена aria-busy и показывает спиннер', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button loading onClick={handleClick}>
        Проверяем…
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Проверяем…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(within(button).getByTestId('spinner')).toBeInTheDocument()

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('по умолчанию имеет type="button"', () => {
    render(<Button>Войти</Button>)

    expect(screen.getByRole('button', { name: 'Войти' })).toHaveAttribute('type', 'button')
  })
})

describe('SecretInput', () => {
  it('переключает видимость значения, aria-pressed и подпись кнопки', async () => {
    const user = userEvent.setup()
    render(
      <>
        <label htmlFor="token">apiTokenInstance</label>
        <SecretInput id="token" showLabel="Показать токен" hideLabel="Скрыть токен" />
      </>,
    )

    const input = screen.getByLabelText('apiTokenInstance')
    expect(input).toHaveAttribute('type', 'password')

    const toggle = screen.getByRole('button', { name: 'Показать токен' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(input).toHaveAttribute('type', 'text')
    const hideToggle = screen.getByRole('button', { name: 'Скрыть токен' })
    expect(hideToggle).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Checkbox', () => {
  it('переключается кликом по лейблу и связан с подсказкой', async () => {
    const user = userEvent.setup()
    render(<ControlledCheckbox />)

    const checkbox = screen.getByRole('checkbox', { name: 'Запомнить меня' })
    expect(checkbox).not.toBeChecked()
    expect(checkbox).toHaveAccessibleDescription('Не включайте на чужом компьютере')

    await user.click(screen.getByText('Запомнить меня'))

    expect(checkbox).toBeChecked()
  })
})

describe('Disclosure', () => {
  it('раскрывается по клику и показывает содержимое', async () => {
    const user = userEvent.setup()
    render(
      <Disclosure label="Дополнительно">
        <p>Адрес сервера</p>
      </Disclosure>,
    )

    const trigger = screen.getByRole('button', { name: 'Дополнительно' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Адрес сервера')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Адрес сервера')).toBeVisible()
  })
})

describe('Field', () => {
  it('связывает поле с подсказкой', () => {
    render(<FieldHarness hint="Номер инстанса" />)

    expect(screen.getByLabelText('idInstance')).toHaveAccessibleDescription('Номер инстанса')
  })

  it('при ошибке заменяет подсказку текстом ошибки', () => {
    render(<FieldHarness hint="Номер инстанса" error="Только цифры" />)

    const input = screen.getByLabelText('idInstance')
    expect(input).toHaveAccessibleDescription('Только цифры')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Номер инстанса')).not.toBeInTheDocument()
  })

  it('getFieldDescribedBy возвращает id показанного сообщения', () => {
    expect(getFieldDescribedBy('f', { hint: 'h', error: 'e' })).toBe('f-error')
    expect(getFieldDescribedBy('f', { hint: 'h' })).toBe('f-hint')
    expect(getFieldDescribedBy('f', {})).toBeUndefined()
  })
})

describe('Gate', () => {
  it('показывает содержимое при when=true и fallback иначе', () => {
    const { rerender } = render(
      <Gate when fallback={<span>Запасной</span>}>
        <span>Основной</span>
      </Gate>,
    )
    expect(screen.getByText('Основной')).toBeInTheDocument()

    rerender(
      <Gate when={false} fallback={<span>Запасной</span>}>
        <span>Основной</span>
      </Gate>,
    )
    expect(screen.getByText('Запасной')).toBeInTheDocument()
    expect(screen.queryByText('Основной')).not.toBeInTheDocument()
  })
})
