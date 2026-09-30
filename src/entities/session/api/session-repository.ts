import { buildMethodUrl } from '@/shared/api/build-method-url'
import type { Credentials } from '@/shared/api/credentials'
import { greenApiClient } from '@/shared/api/green-api-client'
import { parseResponse } from '@/shared/api/parse-response'

import { stateInstanceResponseSchema } from './session-dto'

export const sessionRepository = {
  getState: (credentials: Credentials, signal?: AbortSignal) =>
    greenApiClient
      .get<unknown>(buildMethodUrl(credentials, 'getStateInstance'), { signal })
      .then((response) => parseResponse(stateInstanceResponseSchema, response.data).stateInstance),
}
