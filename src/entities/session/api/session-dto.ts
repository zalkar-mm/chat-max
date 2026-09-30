import { z } from 'zod'

export const stateInstanceResponseSchema = z.object({
  stateInstance: z.string(),
})
