import { z } from 'zod'

import { isSupportedPhone, normalizePhone } from '@/entities/chat/lib/phone'

export const PHONE_FORMAT_ERROR =
  'Номер должен быть российским (+7, 11 цифр) или белорусским (+375, 12 цифр)'

export const createChatSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Введите номер телефона')
    .refine((value) => isSupportedPhone(normalizePhone(value)), PHONE_FORMAT_ERROR),
})

export type CreateChatValues = z.infer<typeof createChatSchema>
