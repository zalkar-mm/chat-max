import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session/model/session.store'

import { server } from '@/mocks/node'
import { createChatViaForm, renderSignedInApp } from '@/test/render-app'

const openChat = async (phone = '79991234567') => {
  const view = await renderSignedInApp()
  await createChatViaForm(view.user, phone)
  const composer = screen.getByRole('textbox', { name: 'Сообщение' })
  const sendButton = screen.getByRole('button', { name: 'Отправить' })
  return { ...view, composer, sendButton }
}

// Подпись статуса для скринридера; «, отправлено» целиком — не путать с «, не отправлено».
const SENT = ', отправлено'

const feed = () => screen.getByRole('log', { name: 'Сообщения' })

const sendRequests = () => {
  const bodies: unknown[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('sendMessage')) {
      void request
        .clone()
        .json()
        .then((body: unknown) => bodies.push(body))
    }
  })
  return bodies
}

describe('Спринт 2, задача 4 — лента', () => {
  it('1: новый чат → «Напишите первое сообщение»', async () => {
    await openChat()
    expect(screen.getByText('Напишите первое сообщение')).toBeInTheDocument()
  })

  it('2–4: своё сообщение со временем; HTML буквально; переносы строк сохранены', async () => {
    const { user, composer } = await openChat()
    await user.type(composer, '<b>привет</b>{Shift>}{Enter}{/Shift}вторая строка{Enter}')
    const bubbleText = await within(feed()).findByText(/<b>привет<\/b>/)
    expect(bubbleText.textContent).toBe('<b>привет</b>\nвторая строка')
    expect(feed().querySelector('b')).toBeNull()
    expect(within(feed()).getByText(/^, (отправляется|отправлено)$/)).toBeInTheDocument()
  })

  it('7: после отправки лента прокручивается к новому сообщению', async () => {
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo')
    const { user, composer } = await openChat()
    await user.type(composer, 'Привет{Enter}')
    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    })
  })
})

describe('Спринт 2, задача 5 — поле ввода', () => {
  it('1: пусто или только пробелы → кнопка неактивна, Enter ничего не делает', async () => {
    const bodies = sendRequests()
    const { user, composer, sendButton } = await openChat()
    expect(sendButton).toBeDisabled()
    await user.type(composer, '   {Enter}')
    expect(sendButton).toBeDisabled()
    expect(bodies).toEqual([])
  })

  it('2: Shift+Enter добавляет перенос и не отправляет', async () => {
    const bodies = sendRequests()
    const { user, composer } = await openChat()
    await user.type(composer, 'a{Shift>}{Enter}{/Shift}b')
    expect(composer).toHaveValue('a\nb')
    expect(bodies).toEqual([])
  })

  it('Enter во время IME-ввода подтверждает слово и не отправляет сообщение', async () => {
    const bodies = sendRequests()
    const { user, composer } = await openChat()
    await user.type(composer, 'привет')

    fireEvent.keyDown(composer, { key: 'Enter', isComposing: true })
    // Safari подтверждает IME Enter-ом с isComposing: false, но keyCode 229.
    fireEvent.keyDown(composer, { key: 'Enter', keyCode: 229 })

    expect(composer).toHaveValue('привет')
    expect(bodies).toEqual([])

    fireEvent.keyDown(composer, { key: 'Enter' })
    expect(await within(feed()).findByText('привет')).toBeInTheDocument()
    expect(composer).toHaveValue('')
  })

  it('4–5: счётчик с 3800 символов; 4001 → «Максимум 4000 символов», отправка невозможна', async () => {
    const { user, composer, sendButton } = await openChat()
    await user.click(composer)
    await user.paste('x'.repeat(3799))
    expect(screen.queryByText('3799 / 4000')).not.toBeInTheDocument()
    await user.type(composer, 'x')
    expect(screen.getByText('3800 / 4000')).toBeInTheDocument()

    await user.paste('x'.repeat(201))
    expect(screen.getByText('Максимум 4000 символов')).toBeInTheDocument()
    expect(sendButton).toBeDisabled()
  })

  it('6: инстанс перешёл в notAuthorized → поле неактивно с пояснением', async () => {
    const { composer } = await openChat()
    act(() => {
      useSessionStore.getState().setInstanceState('notAuthorized')
    })
    expect(composer).toBeDisabled()
    expect(composer).toHaveAttribute('placeholder', 'Инстанс не подключён — отправка недоступна')
  })

  it('черновик своего чата сохраняется при переключении', async () => {
    const { user, composer } = await openChat('79991234567')
    await user.type(composer, 'черновик')
    await createChatViaForm(user, '79997654321')
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
    const list = screen.getByRole('navigation', { name: 'Список чатов' })
    await user.click(within(list).getByRole('button', { name: /\+7 999 123-45-67/ }))
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('черновик')
  })
})

describe('Спринт 2, задача 6 — отправка и статусы', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('1–2: сразу «отправляется», затем «отправлено»; в запросе chatId и текст без пробелов по краям', async () => {
    const bodies = sendRequests()
    const { user, composer } = await openChat()
    await user.type(composer, '  Привет  {Enter}')
    expect(composer).toHaveValue('')
    expect(composer).toHaveFocus()
    expect(await within(feed()).findByText(SENT)).toBeInTheDocument()
    expect(bodies).toEqual([{ chatId: '191234567', message: 'Привет' }])
  })

  it('3: три сообщения подряд уходят по порядку, в полёте не больше одного', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const order: string[] = []
    server.use(
      http.post('*/waInstance:id/sendMessage/:token', async ({ request }) => {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        const body: unknown = await request.json()
        const message =
          typeof body === 'object' && body !== null && 'message' in body ? String(body.message) : ''
        order.push(message)
        await new Promise((resolve) => setTimeout(resolve, 20))
        inFlight -= 1
        return HttpResponse.json({ idMessage: message })
      }),
    )
    const { user, composer } = await openChat()
    await user.type(composer, 'один{Enter}два{Enter}три{Enter}')
    await waitFor(() => {
      expect(within(feed()).getAllByText(SENT)).toHaveLength(3)
    })
    expect(order).toEqual(['один', 'два', 'три'])
    expect(maxInFlight).toBe(1)
  })

  it('4: нет сети → «Нет соединения. Повторить»; «Повторить» → отправлено, без дубля', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    server.use(http.post('*/waInstance:id/sendMessage/:token', () => HttpResponse.error()))
    const { user, composer } = await openChat()
    await user.type(composer, 'Привет{Enter}')
    expect(await within(feed()).findByText('Нет соединения.')).toBeInTheDocument()

    onLine.mockReturnValue(true)
    server.resetHandlers()
    await user.click(within(feed()).getByRole('button', { name: 'Повторить' }))
    expect(await within(feed()).findByText(SENT)).toBeInTheDocument()
    expect(within(feed()).getAllByText('Привет')).toHaveLength(1)
  })

  it('5: 403 → текст про ограничение и жёлтый баннер', async () => {
    const { user, composer } = await openChat()
    await user.type(composer, 'Привет #403{Enter}')
    expect(
      await within(feed()).findByText(
        'Не отправлено: аккаунт ограничен, можно писать только контактам.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Аккаунт MAX временно ограничен: сообщения можно отправлять только контактам',
      ),
    ).toBeInTheDocument()
  })

  it('6: 466 → текст про лимит, «Повторить» нет', async () => {
    const { user, composer } = await openChat()
    await user.type(composer, 'Привет #466{Enter}')
    expect(
      await within(feed()).findByText('Не отправлено: исчерпан лимит бесплатного тарифа'),
    ).toBeInTheDocument()
    expect(within(feed()).queryByRole('button', { name: 'Повторить' })).not.toBeInTheDocument()
  })

  it('7: во время отправки можно печатать следующее сообщение', async () => {
    const { user, composer } = await openChat()
    await user.type(composer, 'первое{Enter}второе')
    expect(composer).toHaveValue('второе')
    expect(composer).not.toBeDisabled()
  })
})

describe('Спринт 2, задача 3 — список чатов', () => {
  it('1–2: новые сверху; отправка поднимает чат наверх с «Вы: …» и временем', async () => {
    const view = await renderSignedInApp()
    await createChatViaForm(view.user, '79991111111')
    await createChatViaForm(view.user, '79992222222')
    await createChatViaForm(view.user, '79993333333')
    const list = screen.getByRole('navigation', { name: 'Список чатов' })
    const titles = () =>
      within(list)
        .getAllByRole('button')
        .map((item) => item.textContent ?? '')
    expect(titles()[0]).toContain('+7 999 333-33-33')
    expect(titles()[2]).toContain('+7 999 111-11-11')

    await view.user.click(within(list).getByRole('button', { name: /\+7 999 111-11-11/ }))
    await view.user.type(screen.getByRole('textbox', { name: 'Сообщение' }), 'Привет{Enter}')
    await waitFor(() => {
      expect(titles()[0]).toContain('+7 999 111-11-11')
    })
    expect(titles()[0]).toContain('Вы: Привет')
    expect(titles()[0]).toMatch(/\d{2}:\d{2}/)
  })

  it('5: список управляется с клавиатуры — Enter на элементе открывает чат', async () => {
    const view = await renderSignedInApp()
    await createChatViaForm(view.user, '79991111111')
    await createChatViaForm(view.user, '79992222222')
    const list = screen.getByRole('navigation', { name: 'Список чатов' })
    within(list)
      .getByRole('button', { name: /\+7 999 111-11-11/ })
      .focus()
    await view.user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: '+7 999 111-11-11' })).toBeInTheDocument()
  })

  it('«Назад к списку» возвращает к списку (mobile master-detail)', async () => {
    const view = await renderSignedInApp()
    await createChatViaForm(view.user, '79991111111')
    await view.user.click(screen.getByRole('button', { name: 'Назад к списку' }))
    expect(view.router.state.location.pathname).toBe('/')
    expect(screen.getByRole('navigation', { name: 'Список чатов' })).toBeInTheDocument()
  })

  it('4: активный чат подсвечен', async () => {
    const view = await renderSignedInApp()
    await createChatViaForm(view.user, '79991111111')
    const list = screen.getByRole('navigation', { name: 'Список чатов' })
    expect(within(list).getByRole('button', { name: /\+7 999 111-11-11/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })
})
