import { z } from 'zod/mini'

import { isSupportedPhone, normalizePhone } from '@/entities/chat/lib/phone'

export const PHONE_FORMAT_ERROR =
  'Номер должен быть российским (+7, 11 цифр) или белорусским (+375, 12 цифр)'

export const createChatSchema = z.object({
  phone: z.string().check(
    z.trim(),
    z.minLength(1, 'Введите номер телефона'),
    z.refine((value) => isSupportedPhone(normalizePhone(value)), PHONE_FORMAT_ERROR),
  ),
})

export type CreateChatValues = z.infer<typeof createChatSchema>
