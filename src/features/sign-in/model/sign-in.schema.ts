import { z } from 'zod/mini'

import { DEFAULT_API_URL } from '@/shared/config/env'
import { isGreenApiUrl } from '@/shared/config/green-api-hosts'

export const signInSchema = z.object({
  idInstance: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, 'Введите idInstance'),
      z.regex(/^\d+$/, 'idInstance состоит только из цифр'),
    ),
  apiTokenInstance: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, 'Введите apiTokenInstance'),
      z.regex(/^\S+$/, 'Токен не должен содержать пробелов'),
    ),
  apiUrl: z
    .string()
    .check(
      z.trim(),
      z.regex(/^https:\/\/\S+$/, 'Укажите адрес в формате https://…'),
      z.refine(isGreenApiUrl, 'Адрес должен быть на домене green-api.com или greenapi.com'),
    ),
  remember: z.boolean(),
})

export type SignInInput = z.input<typeof signInSchema>
export type SignInValues = z.output<typeof signInSchema>

export const EMPTY_SIGN_IN_VALUES: SignInValues = {
  idInstance: '',
  apiTokenInstance: '',
  apiUrl: DEFAULT_API_URL,
  remember: false,
}
