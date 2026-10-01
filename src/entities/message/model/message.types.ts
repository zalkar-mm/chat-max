export type MessageId = string

/** Задание — только текст; остальные типы показываются плейсхолдером. */
export type MessageContent = 'text' | 'unsupported'

export type SendFailure =
  | 'offline'
  | 'suspended'
  | 'quotaExceeded'
  | 'rejected'
  | 'failed'
  /** Отправка принята API, но событие статуса сообщило, что сообщение не доставлено. */
  | 'undelivered'

/** Подтверждённые этапы доставки: только повышаются (отправлено → доставлено → прочитано). */
export type DeliveryAck = 'sent' | 'delivered' | 'read'

export type OutgoingDelivery =
  | { status: 'sending' }
  | { status: DeliveryAck; idMessage: string }
  | { status: 'failed'; failure: SendFailure }

type MessageBase = {
  id: MessageId
  chatId: string
  text: string
  content: MessageContent
  createdAt: number
}

export type OutgoingMessage = MessageBase & { direction: 'outgoing'; delivery: OutgoingDelivery }

export type IncomingMessage = MessageBase & { direction: 'incoming'; idMessage: string }

export type Message = OutgoingMessage | IncomingMessage

/** Событие статуса из очереди GREEN-API: доставлено, прочитано или не доставлено. */
export type DeliveryUpdate = 'delivered' | 'read' | 'failed'
