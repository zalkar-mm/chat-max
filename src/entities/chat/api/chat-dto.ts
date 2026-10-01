import { z } from 'zod/mini'

export const checkAccountResponseSchema = z.object({
  exist: z.boolean(),
  chatId: z.string(),
  fromCache: z.optional(z.boolean()),
})
