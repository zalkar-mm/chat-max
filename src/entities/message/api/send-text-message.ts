import type { Credentials } from '@/shared/api/credentials'

import { messageRepository } from './message-repository'

/** Отправка текста в чат. Возвращает `idMessage`, бросает `ApiError`. */
export async function sendTextMessage(
  credentials: Credentials,
  chatId: string,
  text: string,
  signal?: AbortSignal,
): Promise<string> {
  const { idMessage } = await messageRepository.send(credentials, { chatId, message: text }, signal)
  return idMessage
}
