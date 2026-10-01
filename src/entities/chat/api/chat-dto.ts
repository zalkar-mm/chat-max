import { z } from 'zod'

export const checkAccountResponseSchema = z.object({
  exist: z.boolean(),
  chatId: z.string(),
  fromCache: z.boolean().optional(),
})
