import { z } from 'zod'

/** Пустая очередь — `null`. Тело события разбирает получатель: форма зависит от `typeWebhook`. */
export const receiveNotificationResponseSchema = z
  .object({
    receiptId: z.number(),
    body: z.unknown(),
  })
  .nullable()

export const deleteNotificationResponseSchema = z.object({
  result: z.boolean(),
})
