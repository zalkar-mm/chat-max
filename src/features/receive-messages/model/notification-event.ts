import type { DeliveryUpdate, MessageContent } from '@/entities/message/model/message.types'
import type { InstanceState } from '@/entities/session/model/instance-state'

export type IncomingMessageEvent = {
  kind: 'incomingMessage'
  idMessage: string
  chatId: string
  /** Номер отправителя (только цифры), если MAX его прислал. */
  phone: string | null
  /** Имя: контакт → профиль → название чата; null — неизвестно. */
  name: string | null
  text: string
  content: MessageContent
  sentAt: number
}

export type OutgoingMessageEvent = {
  kind: 'outgoingMessage'
  /** api — эхо отправки через sendMessage, phone — написано с телефона или в другом клиенте. */
  source: 'api' | 'phone'
  idMessage: string
  chatId: string
  /** Название чата получателя, если MAX его прислал (сообщение с телефона в новый чат). */
  name: string | null
  text: string
  content: MessageContent
  sentAt: number
}

export type NotificationEvent =
  | IncomingMessageEvent
  | OutgoingMessageEvent
  | { kind: 'deliveryStatus'; idMessage: string; update: DeliveryUpdate }
  | { kind: 'instanceState'; state: InstanceState }
  | { kind: 'quotaExceeded' }
  /** Группы, реакции, правки и всё нераспознанное: удаляем из очереди и ничего не показываем. */
  | { kind: 'ignored' }
