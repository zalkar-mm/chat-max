import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { renderApp } from '@/test/render-app'

const idInstanceField = () => screen.getByLabelText('idInstance')
const tokenField = () => screen.getByLabelText('apiTokenInstance')
const submitButton = () => screen.getByRole('button', { name: /Войти|Проверяем/ })

const countStateRequests = () => {
  const counter = { value: 0 }
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('getStateInstance')) counter.value += 1
  })
  return counter
}

describe('Задача 1 — форма входа', () => {
  it('1: пустая форма — «Войти» неактивна', async () => {
    await renderApp({ path: '/sign-in' })
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('2: пробелы по краям idInstance обрезаются при уходе из поля', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(idInstanceField(), ' 3100000000 ')
    await user.tab()
    expect(idInstanceField()).toHaveValue('3100000000')
    expect(screen.queryByText('idInstance состоит только из цифр')).not.toBeInTheDocument()
  })

  it('3: не-цифры в idInstance — ошибка после ухода из поля', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(idInstanceField(), '31a0')
    await user.tab()
    expect(await screen.findByText('idInstance состоит только из цифр')).toBeInTheDocument()
    expect(idInstanceField()).toHaveAttribute('aria-invalid', 'true')
    expect(idInstanceField()).toHaveAccessibleDescription('idInstance состоит только из цифр')
  })

  it('4: токен скрыт, «глаз» показывает и скрывает его', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    expect(tokenField()).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Показать токен' }))
    expect(tokenField()).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Скрыть токен' }))
    expect(tokenField()).toHaveAttribute('type', 'password')
  })

  it('5: пробел внутри токена — ошибка, запрос не уходит', async () => {
    const requests = countStateRequests()
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(idInstanceField(), '3100000001')
    await user.type(tokenField(), 'abc def')
    await user.click(submitButton())
    expect(await screen.findByText('Токен не должен содержать пробелов')).toBeInTheDocument()
    expect(requests.value).toBe(0)
  })

  it('6: Enter в поле токена запускает вход', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(idInstanceField(), '3100000001')
    await user.type(tokenField(), 'token{Enter}')
    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  })

  it('7: повторный клик во время проверки не отправляет второй запрос', async () => {
    server.use(
      http.get('*/waInstance:id/getStateInstance/:token', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ stateInstance: 'authorized' })
      }),
    )
    const requests = countStateRequests()
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(idInstanceField(), '3100000001')
    await user.type(tokenField(), 'token')
    await user.click(submitButton())
    expect(submitButton()).toHaveTextContent('Проверяем…')
    await user.click(submitButton())
    await screen.findByRole('heading', { name: 'Чаты' })
    expect(requests.value).toBe(1)
  })

  it('ошибка сервера показывается над кнопкой и исчезает при правке поля', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    await user.type(idInstanceField(), '3100000001')
    await user.type(tokenField(), 'wrong')
    await user.click(submitButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Неверный idInstance или apiTokenInstance',
    )
    expect(idInstanceField()).toHaveValue('3100000001')
    expect(tokenField()).toHaveValue('wrong')

    await user.type(tokenField(), 'x')
    await waitFor(() => {
      expect(screen.queryByText('Неверный idInstance или apiTokenInstance')).not.toBeInTheDocument()
    })
  })

  it('неверный API URL раскрывает «Дополнительно» с ошибкой', async () => {
    const { user } = await renderApp({ path: '/sign-in' })
    await user.click(screen.getByRole('button', { name: 'Дополнительно' }))
    await user.clear(screen.getByLabelText('API URL'))
    await user.type(screen.getByLabelText('API URL'), 'http://example.com')
    await user.type(idInstanceField(), '3100000001')
    await user.type(tokenField(), 'token')
    await user.click(submitButton())
    expect(await screen.findByText('Укажите адрес в формате https://…')).toBeInTheDocument()
  })
})
