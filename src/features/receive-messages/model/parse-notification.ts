import { z } from 'zod'

import type { DeliveryUpdate, MessageContent } from '@/entities/message/model/message.types'
import { toInstanceState } from '@/entities/session/lib/to-instance-state'

import type { NotificationEvent } from './notification-event'

const optionalString = z.string().nullish()

const senderDataSchema = z.object({
  chatId: z.string().min(1),
  chatType: optionalString,
  chatName: optionalString,
  senderName: optionalString,
  senderContactName: optionalString,
  senderPhoneNumber: z.union([z.number(), z.string()]).nullish(),
})

const messageDataSchema = z.object({
  typeMessage: z.string(),
  textMessageData: z.object({ textMessage: z.string() }).nullish(),
  extendedTextMessageData: z.object({ text: z.string() }).nullish(),
})

const messageWebhookSchema = z.object({
  typeWebhook: z.enum([
    'incomingMessageReceived',
    'outgoingMessageReceived',
    'outgoingAPIMessageReceived',
  ]),
  idMessage: z.string().min(1),
  timestamp: z.number(),
  senderData: senderDataSchema,
  messageData: messageDataSchema,
})

const statusWebhookSchema = z.object({
  typeWebhook: z.literal('outgoingMessageStatus'),
  idMessage: z.string().min(1),
  status: z.string(),
})

const stateWebhookSchema = z.object({
  typeWebhook: z.literal('stateInstanceChanged'),
  stateInstance: z.string(),
})

const typeOnlySchema = z.object({ typeWebhook: z.string() })

const IGNORED: NotificationEvent = { kind: 'ignored' }

/** Типы, которые не являются сообщением для ленты: реакции, правки, удаления. */
const NON_MESSAGE_TYPES: ReadonlySet<string> = new Set([
  'reactionMessage',
  'editedMessage',
  'deletedMessage',
])

const DELIVERY_UPDATE: Readonly<Record<string, DeliveryUpdate>> = {
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
}

const nonEmpty = (value: string | null | undefined) => {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return null
  return trimmed
}

const toDigits = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const digits = String(value).replace(/\D/g, '')
  return digits === '' ? null : digits
}

type MessageData = z.infer<typeof messageDataSchema>

function toContent(data: MessageData): { text: string; content: MessageContent } {
  const text = data.textMessageData?.textMessage ?? data.extendedTextMessageData?.text
  if (text !== undefined) return { text, content: 'text' }
  return { text: '', content: 'unsupported' }
}

/** Группы вне scope: тип чата `group` или идентификатор группы MAX (начинается с «-»). */
const isGroupChat = (sender: z.infer<typeof senderDataSchema>) =>
  sender.chatType === 'group' || sender.chatId.startsWith('-')

function parseMessage(body: unknown): NotificationEvent | null {
  const parsed = messageWebhookSchema.safeParse(body)
  if (!parsed.success) return null
  const { typeWebhook, idMessage, timestamp, senderData, messageData } = parsed.data
  if (isGroupChat(senderData) || NON_MESSAGE_TYPES.has(messageData.typeMessage)) return IGNORED

  const base = {
    idMessage,
    chatId: senderData.chatId,
    sentAt: timestamp * 1000,
    ...toContent(messageData),
  }
  if (typeWebhook === 'incomingMessageReceived') {
    return {
      kind: 'incomingMessage',
      ...base,
      phone: toDigits(senderData.senderPhoneNumber),
      name:
        nonEmpty(senderData.senderContactName) ??
        nonEmpty(senderData.senderName) ??
        nonEmpty(senderData.chatName),
    }
  }
  const source = typeWebhook === 'outgoingAPIMessageReceived' ? 'api' : 'phone'
  return { kind: 'outgoingMessage', source, ...base, name: nonEmpty(senderData.chatName) }
}

/**
 * Тело события очереди → доменное событие. Никогда не бросает: всё, что не разобрать, — `ignored`,
 * такое событие всё равно удаляется, иначе очередь встанет.
 */
export function parseNotification(body: unknown): NotificationEvent {
  const type = typeOnlySchema.safeParse(body)
  if (!type.success) return IGNORED

  switch (type.data.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived':
      return parseMessage(body) ?? IGNORED
    case 'outgoingMessageStatus': {
      const parsed = statusWebhookSchema.safeParse(body)
      const update = parsed.success ? DELIVERY_UPDATE[parsed.data.status] : undefined
      if (!parsed.success || update === undefined) return IGNORED
      return { kind: 'deliveryStatus', idMessage: parsed.data.idMessage, update }
    }
    case 'stateInstanceChanged': {
      const parsed = stateWebhookSchema.safeParse(body)
      if (!parsed.success) return IGNORED
      return { kind: 'instanceState', state: toInstanceState(parsed.data.stateInstance) }
    }
    case 'quotaExceeded':
      return { kind: 'quotaExceeded' }
    default:
      return IGNORED
  }
}
