import { z } from 'zod/mini'

/** Пустая очередь — `null`. Тело события разбирает получатель: форма зависит от `typeWebhook`. */
export const receiveNotificationResponseSchema = z.nullable(
  z.object({
    receiptId: z.number(),
    body: z.unknown(),
  }),
)

export const deleteNotificationResponseSchema = z.object({
  result: z.boolean(),
})
