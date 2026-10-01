import type { Credentials } from '@/shared/api/credentials'

import { chatRepository } from './chat-repository'

export type CheckAccountResult = { exists: true; chatId: string } | { exists: false }

/** Есть ли у номера аккаунт MAX и его `chatId`. `phoneDigits` — уже нормализованный номер. Бросает `ApiError`. */
export async function checkAccount(
  credentials: Credentials,
  phoneDigits: string,
  signal?: AbortSignal,
): Promise<CheckAccountResult> {
  const response = await chatRepository.checkAccount(credentials, Number(phoneDigits), signal)
  if (!response.exist || response.chatId === '') return { exists: false }
  return { exists: true, chatId: response.chatId }
}
