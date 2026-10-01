import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { createChatViaForm, renderSignedInApp } from '@/test/render-app'

const checkAccountRequests = () => {
  const bodies: unknown[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('checkAccount')) {
      void request
        .clone()
        .json()
        .then((body: unknown) => bodies.push(body))
    }
  })
  return bodies
}

const openForm = async () => {
  const view = await renderSignedInApp()
  await view.user.click(screen.getByRole('button', { name: 'Новый чат' }))
  const dialog = await screen.findByRole('dialog', { name: 'Новый чат' })
  const phone = within(dialog).getByLabelText('Номер телефона')
  const submit = within(dialog).getByRole('button', { name: /Создать чат|Ищем в MAX/ })
  return { ...view, dialog, phone, submit }
}

describe('Спринт 2, задача 1 — форма «Новый чат»', () => {
  it('1: пустое поле → «Создать чат» неактивна; фокус в поле', async () => {
    const { phone, submit } = await openForm()
    expect(submit).toBeDisabled()
    expect(phone).toHaveFocus()
  })

  it('2: «8 999 123 45 67» → запрос с номером 79991234567', async () => {
    const bodies = checkAccountRequests()
    const { user, phone } = await openForm()
    await user.type(phone, '8 999 123 45 67{Enter}')
    await screen.findByRole('heading', { name: '+7 999 123-45-67' })
    expect(bodies).toEqual([{ phoneNumber: 79991234567 }])
  })

  it('3: «+375 29 123-45-67» → запрос с номером 375291234567', async () => {
    const bodies = checkAccountRequests()
    const { user, phone } = await openForm()
    await user.type(phone, '+375 29 123-45-67{Enter}')
    await screen.findByRole('heading', { name: '+375 29 123-45-67' })
    expect(bodies).toEqual([{ phoneNumber: 375291234567 }])
  })

  it.each(['+996 555 123 456', '+7 999 123'])(
    '4–5: «%s» → ошибка формата, запроса нет',
    async (input) => {
      const bodies = checkAccountRequests()
      const { user, phone } = await openForm()
      await user.type(phone, `${input}{Enter}`)
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Номер должен быть российским (+7, 11 цифр) или белорусским (+375, 12 цифр)',
      )
      expect(phone).toHaveValue(input)
      expect(bodies).toEqual([])
    },
  )

  it('6: Esc закрывает форму, фокус возвращается на «Новый чат»', async () => {
    const { user } = await openForm()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Новый чат' })).toHaveFocus()
  })

  it('7: во время проверки Esc и повторный Enter ничего не делают', async () => {
    let requests = 0
    let release: () => void = () => undefined
    server.use(
      http.post('*/waInstance:id/checkAccount/:token', async () => {
        requests += 1
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return HttpResponse.json({ exist: true, chatId: '100' })
      }),
    )
    const { user, phone, dialog } = await openForm()
    await user.type(phone, '79991234567{Enter}')
    expect(await within(dialog).findByRole('button', { name: 'Ищем в MAX…' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(requests).toBe(1)
    release()
    await screen.findByRole('heading', { name: '+7 999 123-45-67' })
  })

  it('8: Tab не выходит за пределы формы', async () => {
    const { user, dialog } = await openForm()
    for (let step = 0; step < 6; step += 1) {
      await user.tab()
      expect(dialog).toContainElement(
        document.activeElement instanceof HTMLElement ? document.activeElement : null,
      )
    }
  })
})

describe('Спринт 2, задача 2 — поиск номера и создание чата', () => {
  it('1: номер с MAX → чат первым в списке, открыт, в шапке номер', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    expect(screen.getByRole('heading', { name: '+7 999 123-45-67' })).toBeInTheDocument()
    const list = screen.getByRole('navigation', { name: 'Чаты' })
    expect(within(list).getAllByRole('button')[0]).toHaveTextContent('+7 999 123-45-67')
  })

  it('2: тот же номер в другом написании → существующий чат без нового запроса', async () => {
    const bodies = checkAccountRequests()
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    await createChatViaForm(user, '8 (999) 123-45-67')
    const list = screen.getByRole('navigation', { name: 'Чаты' })
    expect(within(list).getAllByRole('button')).toHaveLength(1)
    expect(bodies).toHaveLength(1)
  })

  it.each([
    ['79990000000', 'Этот номер не зарегистрирован в MAX'],
    ['79990004690', 'Слишком много проверок номеров. Попробуйте через 2 часа'],
    ['79990004660', 'Лимит бесплатного тарифа исчерпан. Смените тариф в личном кабинете GREEN-API'],
    ['79990004030', 'Инстанс не подключён к MAX. Проверьте его в личном кабинете'],
    ['79990005000', 'Сервис GREEN-API недоступен. Попробуйте позже'],
  ])('3–5: %s → «%s», форма открыта, номер на месте', async (number, text) => {
    const { user, phone } = await openForm()
    await user.type(phone, `${number}{Enter}`)
    expect(await screen.findByRole('alert')).toHaveTextContent(text)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(phone).toHaveValue(number)
  })

  it('6: проверка не вызывается во время ввода', async () => {
    const bodies = checkAccountRequests()
    const { user, phone } = await openForm()
    await user.type(phone, '79991234567')
    await user.tab()
    expect(bodies).toEqual([])
  })

  it('«Назад» браузера закрывает форму; из созданного чата «Назад» ведёт к списку', async () => {
    const { user, router } = await openForm()
    await act(() => router.navigate(-1))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    await createChatViaForm(user, '79991234567')
    await act(() => router.navigate(-1))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('закрытие формы кнопкой снимает её запись из истории', async () => {
    const { user, router } = await openForm()
    const entries = router.state.historyAction
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(router.state.historyAction).toBe('POP')
    })
    expect(entries).toBe('PUSH')
  })
})
