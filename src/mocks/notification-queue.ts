/**
 * Очередь уведомлений GREEN-API для моков: FIFO, событие живёт до deleteNotification,
 * receiveNotification ждёт события (long-poll) или таймаута.
 */
type QueuedNotification = { receiptId: number; body: Record<string, unknown> }

type InstanceQueue = {
  items: QueuedNotification[]
  waiters: Set<() => void>
}

const queues = new Map<string, InstanceQueue>()
let nextReceiptId = 1

const queueFor = (idInstance: string) => {
  const existing = queues.get(idInstance)
  if (existing) return existing
  const created: InstanceQueue = { items: [], waiters: new Set() }
  queues.set(idInstance, created)
  return created
}

export function pushNotification(idInstance: string, body: Record<string, unknown>) {
  const queue = queueFor(idInstance)
  queue.items.push({ receiptId: nextReceiptId, body })
  nextReceiptId += 1
  queue.waiters.forEach((wake) => {
    wake()
  })
}

/** Первое событие очереди; пусто — ждём появления, таймаута или отмены запроса. */
export async function takeNotification(idInstance: string, timeoutMs: number, signal: AbortSignal) {
  const queue = queueFor(idInstance)
  if (queue.items.length === 0) {
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer)
        queue.waiters.delete(done)
        signal.removeEventListener('abort', done)
        resolve()
      }
      const timer = setTimeout(done, timeoutMs)
      queue.waiters.add(done)
      signal.addEventListener('abort', done)
    })
  }
  return queue.items[0] ?? null
}

export function deleteQueued(idInstance: string, receiptId: number) {
  const queue = queueFor(idInstance)
  const index = queue.items.findIndex((item) => item.receiptId === receiptId)
  if (index === -1) return false
  queue.items.splice(index, 1)
  return true
}

export function resetNotificationQueues() {
  queues.clear()
}

// ---- Фабрики тел событий в формате GREEN-API MAX ----

const nowSeconds = () => Math.floor(Date.now() / 1000)

type IncomingOptions = {
  chatId: string
  idMessage: string
  text?: string
  typeMessage?: string
  senderName?: string
  senderPhoneNumber?: number
  chatType?: string
  timestamp?: number
}

export const incomingMessageBody = ({
  chatId,
  idMessage,
  text = '',
  typeMessage = 'textMessage',
  senderName = '',
  senderPhoneNumber,
  chatType = 'user',
  timestamp = nowSeconds(),
}: IncomingOptions) => ({
  typeWebhook: 'incomingMessageReceived',
  timestamp,
  idMessage,
  senderData: {
    chatId,
    chatType,
    chatName: senderName,
    sender: chatId,
    senderName,
    senderContactName: '',
    senderPhoneNumber,
  },
  messageData: {
    typeMessage,
    ...(typeMessage === 'textMessage' ? { textMessageData: { textMessage: text } } : {}),
    ...(typeMessage === 'extendedTextMessage' ? { extendedTextMessageData: { text } } : {}),
  },
})

export const outgoingMessageBody = (
  typeWebhook: 'outgoingAPIMessageReceived' | 'outgoingMessageReceived',
  { chatId, idMessage, text }: { chatId: string; idMessage: string; text: string },
) => ({
  typeWebhook,
  timestamp: nowSeconds(),
  idMessage,
  senderData: { chatId, chatType: 'user' },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
})

export const statusBody = (idMessage: string, status: string) => ({
  typeWebhook: 'outgoingMessageStatus',
  chatId: '',
  timestamp: nowSeconds(),
  idMessage,
  status,
})

export const stateBody = (stateInstance: string) => ({
  typeWebhook: 'stateInstanceChanged',
  timestamp: nowSeconds(),
  stateInstance,
})
