import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/node'
import {
  incomingMessageBody,
  outgoingMessageBody,
  pendingNotifications,
  pushNotification,
  stateBody,
  statusBody,
} from '@/mocks/notification-queue'
import { createChatViaForm, renderSignedInApp } from '@/test/render-app'

const ID = '3100000001'
// chatId, который мок checkAccount выдаёт для 79991234567.
const CHAT_ID = '191234567'

const list = () => screen.getByRole('navigation', { name: 'Список чатов' })
const feed = () => screen.getByRole('log', { name: 'Сообщения' })
const push = (body: Record<string, unknown>) => {
  act(() => {
    pushNotification(ID, body)
  })
}

const reply = (text: string, overrides: Partial<Parameters<typeof incomingMessageBody>[0]> = {}) =>
  incomingMessageBody({ chatId: CHAT_ID, idMessage: `in-${text}`, text, ...overrides })

describe('Спринт 3 — получение сообщений', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('задача 2.1, 2.7: ответ попадает в тот же чат слева, время — время отправки', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    const sentAt = new Date(2026, 9, 1, 9, 41).getTime() / 1000
    push(reply('Привет!', { timestamp: sentAt }))

    expect(await within(feed()).findByText('Привет!')).toBeInTheDocument()
    expect(within(feed()).getByText('09:41')).toBeInTheDocument()
    expect(within(list()).getAllByRole('button')).toHaveLength(1)
    await waitFor(() => {
      expect(pendingNotifications(ID)).toBe(0)
    })
  })

  it('задача 2.2–2.3: новый собеседник → новый чат наверху с именем; имя заменяет номер', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    push(reply('Это Анна', { senderName: 'Анна' }))
    expect(await screen.findByRole('heading', { name: 'Анна' })).toBeInTheDocument()
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument()

    push(
      incomingMessageBody({
        chatId: '20000001',
        idMessage: 'b-1',
        text: 'Привет',
        senderName: 'Борис',
      }),
    )
    await waitFor(() => {
      expect(within(list()).getAllByRole('button')[0]).toHaveTextContent('Борис')
    })
  })

  it('задача 2.4–2.6: ссылка — текст; фото — плейсхолдер; группа — ничего, событие удалено', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    push(reply('https://max.ru', { typeMessage: 'extendedTextMessage' }))
    push(reply('фото', { typeMessage: 'imageMessage' }))
    push(
      incomingMessageBody({
        chatId: '-100',
        idMessage: 'g-1',
        text: 'в группе',
        chatType: 'group',
      }),
    )
    push(reply('после всего'))

    expect(await within(feed()).findByText('после всего')).toBeInTheDocument()
    expect(within(feed()).getByText('https://max.ru')).toBeInTheDocument()
    expect(within(feed()).getByText('Сообщение этого типа не поддерживается')).toBeInTheDocument()
    expect(screen.queryByText('в группе')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(pendingNotifications(ID)).toBe(0)
    })
  })

  it('задача 1.7: битое событие удаляется, следующее обрабатывается', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    push({ typeWebhook: 'incomingMessageReceived', senderData: 'битые' })
    push(reply('живой'))
    expect(await within(feed()).findByText('живой')).toBeInTheDocument()
  })

  it('задача 3: эхо своей отправки и повторная доставка не дублируют сообщения', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    await user.type(screen.getByRole('textbox', { name: 'Сообщение' }), 'Привет{Enter}')
    await within(feed()).findByText(', отправлено')

    push(reply('дубль'))
    push(reply('дубль'))
    await within(feed()).findByText('дубль')
    await waitFor(() => {
      expect(pendingNotifications(ID)).toBe(0)
    })
    expect(within(feed()).getAllByText('дубль')).toHaveLength(1)
    expect(within(feed()).getAllByText('Привет')).toHaveLength(1)
  })

  it('задача 3.3 (Could): сообщение с телефона — справа в чате получателя', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    push(
      outgoingMessageBody('outgoingMessageReceived', {
        chatId: CHAT_ID,
        idMessage: 'ph-1',
        text: 'С телефона',
      }),
    )
    expect(await within(feed()).findByText('С телефона')).toBeInTheDocument()
    expect(within(feed()).getByText(', отправлено')).toBeInTheDocument()
  })

  it('задача 4: «доставлено» → «прочитано»; опоздавшее «доставлено» не понижает; «не доставлено» → Повторить', async () => {
    let sent = 0
    server.use(
      http.post('*/waInstance:id/sendMessage/:token', () => {
        sent += 1
        return HttpResponse.json({ idMessage: `api-${sent}` })
      }),
    )
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    const composer = screen.getByRole('textbox', { name: 'Сообщение' })
    await user.type(composer, 'первое{Enter}')
    await within(feed()).findByText(', отправлено')

    push(statusBody('api-1', 'read'))
    expect(await within(feed()).findByText(', прочитано')).toBeInTheDocument()
    push(statusBody('api-1', 'delivered'))
    await waitFor(() => {
      expect(pendingNotifications(ID)).toBe(0)
    })
    expect(within(feed()).getByText(', прочитано')).toBeInTheDocument()

    await user.type(composer, 'второе{Enter}')
    await waitFor(() => {
      expect(sent).toBe(2)
    })
    push(statusBody('api-2', 'failed'))
    expect(await within(feed()).findByText('Не доставлено.')).toBeInTheDocument()
    expect(within(feed()).getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('задача 5.1–5.2: входящее в неоткрытый чат → счётчик и наверх; открыли → счётчик исчез', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991111111')
    await createChatViaForm(user, '79992222222')
    push(incomingMessageBody({ chatId: '191111111', idMessage: 'u-1', text: 'тебе' }))

    const first = await within(list()).findByRole('button', { name: /1 непрочитанных/ })
    expect(within(list()).getAllByRole('button')[0]).toBe(first)
    await user.click(first)
    await waitFor(() => {
      expect(
        within(list()).queryByRole('button', { name: /непрочитанных/ }),
      ).not.toBeInTheDocument()
    })
  })

  it('задача 5.3: вкладка скрыта → «(2) MAX-чат»; вернулись → обычный заголовок', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    push(reply('раз'))
    push(reply('два'))
    await waitFor(() => {
      expect(document.title).toBe('(2) MAX-чат')
    })

    visibility.mockReturnValue('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await waitFor(() => {
      expect(document.title).toBe('MAX-чат')
    })
  })

  it('задача 7.2, 7.4: инстанс отключился → баннер и поле неактивно; authorized → всё вернулось', async () => {
    const { user } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    push(stateBody('notAuthorized'))
    expect(
      await screen.findByText('Инстанс отключён от MAX. Отсканируйте QR-код в личном кабинете'),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Проверить снова' }))
    await waitFor(() => {
      expect(screen.queryByText(/Инстанс отключён от MAX/)).not.toBeInTheDocument()
    })
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeEnabled()
  })

  it('задача 7.3: событие лимита → жёлтый баннер', async () => {
    await renderSignedInApp()
    push({ typeWebhook: 'quotaExceeded', quotaData: {} })
    expect(
      await screen.findByText(
        'Лимит бесплатного тарифа GREEN-API исчерпан. Часть функций недоступна до смены тарифа',
      ),
    ).toBeInTheDocument()
  })

  it('задача 7.3: 466 из очереди → тот же жёлтый баннер лимита', async () => {
    server.use(
      http.get(
        '*/waInstance:id/receiveNotification/:token',
        () => new HttpResponse(null, { status: 466 }),
      ),
    )
    await renderSignedInApp()
    expect(
      await screen.findByText(/Лимит бесплатного тарифа GREEN-API исчерпан/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Сервис GREEN-API недоступен/)).not.toBeInTheDocument()
  })

  it('задача 7.1: Webhook URL в настройках → баннер, получение не запускается', async () => {
    let receives = 0
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('receiveNotification')) receives += 1
    })
    await renderSignedInApp({ idInstance: '3100000060' })
    expect(await screen.findByText(/указан Webhook URL/)).toBeInTheDocument()
    expect(receives).toBe(0)
  })

  it('задача 1.5: три сбоя сервера подряд → баннер с обратным отсчётом', async () => {
    await renderSignedInApp({ idInstance: '3100000070' })
    expect(
      await screen.findByText(/Сервис GREEN-API недоступен/, {}, { timeout: 10_000 }),
    ).toBeInTheDocument()
  }, 15_000)

  it('задача 1, 401 из очереди → вход с «Сессия недействительна, войдите снова»', async () => {
    server.use(
      http.get(
        '*/waInstance:id/receiveNotification/:token',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    await renderSignedInApp()
    expect(await screen.findByText('Сессия недействительна, войдите снова')).toBeInTheDocument()
  })
})
