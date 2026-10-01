import { z } from 'zod/mini'

export const stateInstanceResponseSchema = z.object({
  stateInstance: z.string(),
})
