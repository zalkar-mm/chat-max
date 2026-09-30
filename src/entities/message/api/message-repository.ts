import { buildMethodUrl } from '@/shared/api/build-method-url'
import type { Credentials } from '@/shared/api/credentials'
import { greenApiClient } from '@/shared/api/green-api-client'
import { parseResponse } from '@/shared/api/parse-response'

import { sendMessageResponseSchema } from './message-dto'

type SendMessageBody = { chatId: string; message: string }

export const messageRepository = {
  send: (credentials: Credentials, body: SendMessageBody, signal?: AbortSignal) =>
    greenApiClient
      .post<unknown>(buildMethodUrl(credentials, 'sendMessage'), body, { signal })
      .then((response) => parseResponse(sendMessageResponseSchema, response.data)),
}
