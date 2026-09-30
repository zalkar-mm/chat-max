import type { z } from 'zod'

import { ApiError, ApiErrorKind } from './api-error'

/** Ответ сервера валидируется на входе: всё, что не совпало со схемой, — `ApiError('unknown')`. */
export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) throw new ApiError(ApiErrorKind.Unknown)
  return result.data
}
