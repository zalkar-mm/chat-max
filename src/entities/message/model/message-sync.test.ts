import { describe, expect, it } from 'vitest'

import {
  addIncomingMessage,
  addOutgoingMessage,
  addSyncedOutgoingMessage,
  applyDeliveryUpdate,
  getAllMessages,
  getMessage,
  hydrateMessages,
  markMessageSent,
} from './message.store'

const incoming = (idMessage: string, createdAt = 1) => ({
  chatId: 'c',
  idMessage,
  text: 'привет',
  content: 'text' as const,
  createdAt,
})

describe('message.store — синхронизация с очередью', () => {
  it('повторно доставленное входящее не дублируется', () => {
    expect(addIncomingMessage(incoming('m1'))).toBe(true)
    expect(addIncomingMessage(incoming('m1'))).toBe(false)
    expect(getAllMessages()).toHaveLength(1)
  })

  it('эхо своей отправки с тем же idMessage не добавляется', () => {
    const sent = addOutgoingMessage({ chatId: 'c', text: 'Привет', now: 1 })
    markMessageSent(sent.id, 'api-1')
    expect(addSyncedOutgoingMessage(incoming('api-1'))).toBe(false)
    expect(getAllMessages()).toHaveLength(1)
  })

  it('статусы только повышаются: «доставлено» после «прочитано» ничего не меняет', () => {
    const sent = addOutgoingMessage({ chatId: 'c', text: 'Привет', now: 1 })
    markMessageSent(sent.id, 'api-1')
    applyDeliveryUpdate('api-1', 'read')
    applyDeliveryUpdate('api-1', 'delivered')
    expect(getMessage(sent.id)).toMatchObject({ delivery: { status: 'read' } })
  })

  it('«не доставлено» превращает «отправлено» в ошибку с «Повторить»', () => {
    const sent = addOutgoingMessage({ chatId: 'c', text: 'Привет', now: 1 })
    markMessageSent(sent.id, 'api-1')
    applyDeliveryUpdate('api-1', 'failed')
    expect(getMessage(sent.id)).toMatchObject({
      delivery: { status: 'failed', failure: 'undelivered' },
    })
  })

  it('статус, пришедший раньше idMessage, применяется после подтверждения отправки', () => {
    const sent = addOutgoingMessage({ chatId: 'c', text: 'Привет', now: 1 })
    applyDeliveryUpdate('api-1', 'delivered')
    markMessageSent(sent.id, 'api-1')
    expect(getMessage(sent.id)).toMatchObject({ delivery: { status: 'delivered' } })
  })

  it('восстановление: «отправляется» становится «не отправлено», порядок по времени', () => {
    const sending = addOutgoingMessage({ chatId: 'c', text: 'в полёте', now: 5 })
    addIncomingMessage(incoming('m1', 3))
    const snapshot = getAllMessages()
    hydrateMessages(snapshot)
    expect(getMessage(sending.id)).toMatchObject({
      delivery: { status: 'failed', failure: 'failed' },
    })
    expect(addIncomingMessage(incoming('m1', 3))).toBe(false)
  })
})
