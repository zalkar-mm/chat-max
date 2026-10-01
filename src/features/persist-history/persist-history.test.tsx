import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { incomingMessageBody, pushNotification } from '@/mocks/notification-queue'
import { createChatViaForm, renderApp, renderSignedInApp } from '@/test/render-app'

const HISTORY_KEY = (idInstance: string) => `max-chat:history:${idInstance}`

const list = () => screen.getByRole('navigation', { name: 'Чаты' })

async function chatWithHistory() {
  const view = await renderSignedInApp()
  await createChatViaForm(view.user, '79991234567')
  await view.user.type(screen.getByRole('textbox', { name: 'Сообщение' }), 'Привет{Enter}')
  await screen.findByText(', отправлено')
  act(() => {
    pushNotification(
      '3100000001',
      incomingMessageBody({ chatId: '191234567', idMessage: 'in-1', text: 'Ответ' }),
    )
  })
  await screen.findByText('Ответ')
  await waitFor(() => {
    expect(sessionStorage.getItem(HISTORY_KEY('3100000001'))).toContain('Ответ')
  })
  return view
}

describe('Спринт 3, задача 6 — история после перезагрузки', () => {
  it('1: F5 → чаты, сообщения и статусы на месте', async () => {
    const { unmount } = await chatWithHistory()
    unmount()
    await renderApp({ path: '/chat/191234567' })
    expect(await screen.findByText('Ответ')).toBeInTheDocument()
    expect(screen.getByText('Привет')).toBeInTheDocument()
    expect(screen.getByText(', отправлено')).toBeInTheDocument()
  })

  it('2: «отправляется» во время F5 → «не отправлено» с «Повторить»', async () => {
    const { user, unmount } = await renderSignedInApp()
    await createChatViaForm(user, '79991234567')
    sessionStorage.setItem(
      HISTORY_KEY('3100000001'),
      JSON.stringify({
        version: 1,
        chats: [
          {
            id: '191234567',
            phone: '79991234567',
            name: null,
            title: '+7 999 123-45-67',
            unreadCount: 0,
            createdAt: 1,
            lastActivityAt: 2,
          },
        ],
        messages: [
          {
            id: 'm1',
            chatId: '191234567',
            text: 'в полёте',
            content: 'text',
            createdAt: 2,
            direction: 'outgoing',
            delivery: { status: 'sending' },
          },
        ],
      }),
    )
    unmount()
    await renderApp({ path: '/chat/191234567' })
    expect(await screen.findByText('Не отправлено.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('3: выход → вход тем же инстансом → история пустая', async () => {
    const { user } = await chatWithHistory()
    await user.click(screen.getByRole('button', { name: 'Выйти' }))
    expect(sessionStorage.getItem(HISTORY_KEY('3100000001'))).toBeNull()

    await user.type(await screen.findByLabelText('idInstance'), '3100000001')
    await user.type(screen.getByLabelText('apiTokenInstance'), 'token{Enter}')
    expect(await screen.findByText('Здесь появятся ваши чаты')).toBeInTheDocument()
  })

  it('4: другой инстанс видит только свою историю', async () => {
    const { unmount } = await chatWithHistory()
    unmount()
    sessionStorage.removeItem('max-chat:session')
    await renderSignedInApp({ idInstance: '3100000011' })
    expect(within(list()).queryAllByRole('button', { name: /\+7 999 123-45-67/ })).toHaveLength(0)
    expect(screen.getByText('Здесь появятся ваши чаты')).toBeInTheDocument()
  })

  it('5: повреждённые данные → пустая история без экрана ошибки', async () => {
    sessionStorage.setItem(HISTORY_KEY('3100000001'), '{сломано')
    await renderSignedInApp()
    expect(screen.getByText('Здесь появятся ваши чаты')).toBeInTheDocument()
    expect(screen.queryByText('Что-то пошло не так')).not.toBeInTheDocument()
  })
})
