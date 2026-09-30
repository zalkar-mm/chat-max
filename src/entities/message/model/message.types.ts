export type MessageId = string

export type SendFailure = 'offline' | 'suspended' | 'quotaExceeded' | 'rejected' | 'failed'

export type OutgoingDelivery =
  | { status: 'sending' }
  | { status: 'sent'; idMessage: string }
  | { status: 'failed'; failure: SendFailure }

type MessageBase = {
  id: MessageId
  chatId: string
  text: string
  createdAt: number
}

export type OutgoingMessage = MessageBase & { direction: 'outgoing'; delivery: OutgoingDelivery }

export type IncomingMessage = MessageBase & { direction: 'incoming'; idMessage: string }

export type Message = OutgoingMessage | IncomingMessage
