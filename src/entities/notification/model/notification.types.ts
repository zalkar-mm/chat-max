/** Событие очереди GREEN-API как есть: тело разбирает получатель, форма зависит от `typeWebhook`. */
export type RawNotification = {
  receiptId: number
  body: unknown
}
