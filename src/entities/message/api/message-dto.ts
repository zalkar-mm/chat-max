import { z } from 'zod/mini'

export const sendMessageResponseSchema = z.object({
  idMessage: z.string(),
})
