import { describe, expect, it } from 'vitest'

import { DEFAULT_API_URL } from '@/shared/config/env'

import { signInSchema } from './sign-in.schema'

const valid = {
  idInstance: '1100000001',
  apiTokenInstance: 'token',
  apiUrl: DEFAULT_API_URL,
  remember: false,
}

const firstError = (input: Partial<typeof valid>) => {
  const result = signInSchema.safeParse({ ...valid, ...input })
  return result.success ? null : result.error.issues[0]?.message
}

describe('signInSchema — проверка полей входа', () => {
  it('обрезает пробелы по краям всех полей', () => {
    expect(
      signInSchema.parse({
        ...valid,
        idInstance: '  1100000001 ',
        apiTokenInstance: ' token ',
        apiUrl: ' https://1100.api.green-api.com ',
      }),
    ).toEqual({
      ...valid,
      apiUrl: 'https://1100.api.green-api.com',
    })
  })

  it.each([
    [{ idInstance: '' }, 'Введите idInstance'],
    [{ idInstance: '   ' }, 'Введите idInstance'],
    [{ idInstance: '11000-0001' }, 'idInstance состоит только из цифр'],
    [{ idInstance: 'abc' }, 'idInstance состоит только из цифр'],
    [{ apiTokenInstance: '' }, 'Введите apiTokenInstance'],
    [{ apiTokenInstance: 'to ken' }, 'Токен не должен содержать пробелов'],
    [{ apiUrl: 'http://1100.api.green-api.com' }, 'Укажите адрес в формате https://…'],
    [{ apiUrl: '' }, 'Укажите адрес в формате https://…'],
  ])('%o → «%s»', (input, message) => {
    expect(firstError(input)).toBe(message)
  })

  it('корректные данные проходят без ошибок', () => {
    expect(firstError({})).toBeNull()
  })
})
