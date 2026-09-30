import { buildMethodUrl } from '@/shared/api/build-method-url'
import type { Credentials } from '@/shared/api/credentials'
import { greenApiClient } from '@/shared/api/green-api-client'
import { parseResponse } from '@/shared/api/parse-response'

import { checkAccountResponseSchema } from './chat-dto'

export const chatRepository = {
  checkAccount: (credentials: Credentials, phoneNumber: number, signal?: AbortSignal) =>
    greenApiClient
      .post<unknown>(buildMethodUrl(credentials, 'checkAccount'), { phoneNumber }, { signal })
      .then((response) => parseResponse(checkAccountResponseSchema, response.data)),
}
