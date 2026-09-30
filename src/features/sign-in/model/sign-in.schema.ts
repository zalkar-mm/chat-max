import { z } from 'zod'

import { DEFAULT_API_URL } from '@/shared/config/env'

export const signInSchema = z.object({
  idInstance: z
    .string()
    .trim()
    .min(1, 'Введите idInstance')
    .regex(/^\d+$/, 'idInstance состоит только из цифр'),
  apiTokenInstance: z
    .string()
    .trim()
    .min(1, 'Введите apiTokenInstance')
    .regex(/^\S+$/, 'Токен не должен содержать пробелов'),
  apiUrl: z
    .string()
    .trim()
    .regex(/^https:\/\/\S+$/, 'Укажите адрес в формате https://…'),
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
