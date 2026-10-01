import { describe, expect, it } from 'vitest'

import { parseNotification } from './parse-notification'

// Фикстуры — по примерам документации GREEN-API для MAX.
const incoming = (
  messageData: Record<string, unknown>,
  senderData: Record<string, unknown> = {},
) => ({
  typeWebhook: 'incomingMessageReceived',
  instanceData: { idInstance: 3100000001, wid: '79991234567@c.us', typeInstance: 'v3' },
  timestamp: 1763115112,
  idMessage: '126543123451133331119',
  senderData: {
    chatId: '10000000',
    chatName: 'Sender Name',
    chatType: 'user',
    sender: '10000000',
    senderName: 'Профиль',
    senderType: 'user',
    senderContactName: 'Анна',
    senderPhoneNumber: 79876543210,
    ...senderData,
  },
  messageData,
})

describe('parseNotification', () => {
  it('входящее текстовое: чат, имя из контактов, номер, время отправки в мс', () => {
    expect(
      parseNotification(
        incoming({ typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } }),
      ),
    ).toEqual({
      kind: 'incomingMessage',
      idMessage: '126543123451133331119',
      chatId: '10000000',
      phone: '79876543210',
      name: 'Анна',
      text: 'Привет',
      content: 'text',
      sentAt: 1763115112000,
    })
  })

  it('имя: контакт → профиль → название чата', () => {
    const event = parseNotification(
      incoming(
        { typeMessage: 'textMessage', textMessageData: { textMessage: 'x' } },
        { senderContactName: '', senderName: '' },
      ),
    )
    expect(event).toMatchObject({ name: 'Sender Name' })
  })

  it('текст со ссылкой (extendedTextMessage) — берётся текст', () => {
    const event = parseNotification(
      incoming({
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'смотри https://max.ru', title: 'MAX' },
      }),
    )
    expect(event).toMatchObject({
      kind: 'incomingMessage',
      text: 'смотри https://max.ru',
      content: 'text',
    })
  })

  it('фото — неподдерживаемый тип', () => {
    expect(parseNotification(incoming({ typeMessage: 'imageMessage' }))).toMatchObject({
      kind: 'incomingMessage',
      content: 'unsupported',
    })
  })

  it('группы и реакции игнорируются', () => {
    expect(
      parseNotification(
        incoming(
          { typeMessage: 'textMessage', textMessageData: { textMessage: 'x' } },
          { chatId: '-100500', chatType: 'group' },
        ),
      ),
    ).toEqual({ kind: 'ignored' })
    expect(parseNotification(incoming({ typeMessage: 'reactionMessage' }))).toEqual({
      kind: 'ignored',
    })
  })

  it('эхо отправки через API и сообщение с телефона', () => {
    const body = {
      typeWebhook: 'outgoingAPIMessageReceived',
      timestamp: 1,
      idMessage: 'out-1',
      senderData: { chatId: '10000000', chatType: 'user' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    }
    expect(parseNotification(body)).toMatchObject({ kind: 'outgoingMessage', source: 'api' })
    expect(parseNotification({ ...body, typeWebhook: 'outgoingMessageReceived' })).toMatchObject({
      source: 'phone',
    })
  })

  it.each([
    ['delivered', 'delivered'],
    ['read', 'read'],
    ['failed', 'failed'],
    ['noAccount', 'failed'],
  ])('статус %s → %s', (status, update) => {
    expect(
      parseNotification({
        typeWebhook: 'outgoingMessageStatus',
        chatId: '1',
        idMessage: 'm',
        status,
        timestamp: 1,
      }),
    ).toEqual({ kind: 'deliveryStatus', idMessage: 'm', update })
  })

  it('смена статуса инстанса и лимит тарифа', () => {
    expect(
      parseNotification({ typeWebhook: 'stateInstanceChanged', stateInstance: 'notAuthorized' }),
    ).toEqual({
      kind: 'instanceState',
      state: 'notAuthorized',
    })
    expect(parseNotification({ typeWebhook: 'quotaExceeded', quotaData: {} })).toEqual({
      kind: 'quotaExceeded',
    })
  })

  it.each([null, 'строка', {}, { typeWebhook: 'incomingMessageReceived', senderData: 'битые' }])(
    'битые данные не бросают, а игнорируются: %#',
    (body) => {
      expect(parseNotification(body)).toEqual({ kind: 'ignored' })
    },
  )
})
