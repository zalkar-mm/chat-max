import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TAB_CHANNEL_NAME } from './model/tab-leadership'

import { server } from '@/mocks/node'
import {
  incomingMessageBody,
  pendingNotifications,
  pushNotification,
} from '@/mocks/notification-queue'
import { renderSignedInApp } from '@/test/render-app'

const ID = '3100000001'
const STUB_TITLE = 'Приложение открыто в другой вкладке'

/** Вторая вкладка с той же сессией: свой канал связи и всё, что ей пришло. */
function otherTab() {
  const channel = new BroadcastChannel(TAB_CHANNEL_NAME)
  const received: unknown[] = []
  channel.addEventListener('message', (event) => {
    received.push(event.data)
  })
  return { channel, received }
}

function countGreenApiRequests() {
  const urls: string[] = []
  server.events.on('request:start', ({ request }) => {
    urls.push(request.url)
  })
  return urls
}

async function openedInOtherTab() {
  const view = await renderSignedInApp({ idInstance: ID })
  const other = otherTab()
  act(() => {
    other.channel.postMessage({ type: 'claim', idInstance: ID })
  })
  expect(await screen.findByRole('heading', { name: STUB_TITLE })).toBeInTheDocument()
  return { ...view, other }
}

const pause = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })

describe('Спринт 4, задача 3 — работа в двух вкладках', () => {
  it('1, 4: вторая вкладка забрала сессию → заглушка, запросов к GREEN-API нет', async () => {
    await openedInOtherTab()
    expect(screen.queryByRole('heading', { name: 'Чаты' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(document.title).toBe('MAX-чат — неактивна')
    })

    const requests = countGreenApiRequests()
    act(() => {
      pushNotification(ID, incomingMessageBody({ chatId: '191234567', idMessage: 'in-1' }))
    })
    await pause(300)
    expect(requests).toEqual([])
    expect(pendingNotifications(ID)).toBe(1)
  })

  it('2: «Использовать здесь» → вкладка снова активна, вторая уходит на заглушку, получение идёт', async () => {
    const { user, other } = await openedInOtherTab()
    act(() => {
      pushNotification(
        ID,
        incomingMessageBody({ chatId: '191234567', idMessage: 'in-1', text: 'Пока вас не было' }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Использовать здесь' }))

    expect(await screen.findByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
    await waitFor(() => {
      expect(other.received).toContainEqual({ type: 'claim', idInstance: ID })
    })
    const list = screen.getByRole('navigation', { name: 'Чаты' })
    expect(await within(list).findByText('Пока вас не было')).toBeInTheDocument()
    await waitFor(() => {
      expect(pendingNotifications(ID)).toBe(0)
    })
  })

  it('2: вернувшись, вкладка перечитывает историю, которую записала другая', async () => {
    const { user } = await openedInOtherTab()
    sessionStorage.setItem(
      `max-chat:history:${ID}`,
      JSON.stringify({
        version: 1,
        chats: [
          {
            id: '191234567',
            phone: '79991234567',
            name: 'Анна',
            title: 'Анна',
            unreadCount: 0,
            createdAt: 1,
            lastActivityAt: 2,
          },
        ],
        messages: [],
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Использовать здесь' }))

    const list = await screen.findByRole('navigation', { name: 'Чаты' })
    expect(within(list).getByText('Анна')).toBeInTheDocument()
  })

  it('3: выход в другой вкладке → экран входа', async () => {
    const { other } = await openedInOtherTab()
    act(() => {
      other.channel.postMessage({ type: 'sessionEnded', idInstance: ID, reason: 'signOut' })
    })
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument()
  })

  it('3: «Выйти» на заглушке → экран входа здесь и выход в другой вкладке', async () => {
    const { user, other } = await openedInOtherTab()
    await user.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument()
    await waitFor(() => {
      expect(other.received).toContainEqual({
        type: 'sessionEnded',
        idInstance: ID,
        reason: 'signOut',
      })
    })
  })
})
