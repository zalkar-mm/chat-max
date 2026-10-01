import { z } from 'zod'

import { buildMethodUrl } from '@/shared/api/build-method-url'
import type { Credentials } from '@/shared/api/credentials'
import { greenApiClient } from '@/shared/api/green-api-client'
import { parseResponse } from '@/shared/api/parse-response'

const settingsResponseSchema = z.object({
  webhookUrl: z.string().nullish(),
  incomingWebhook: z.string().nullish(),
})

export type InstanceSettings = {
  /** Задан Webhook URL — HTTP API получения не работает. */
  hasWebhookUrl: boolean
  /** В настройках выключены уведомления о входящих — ответы не придут. */
  isIncomingDisabled: boolean
}

export async function getInstanceSettings(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<InstanceSettings> {
  const response = await greenApiClient.get<unknown>(buildMethodUrl(credentials, 'getSettings'), {
    signal,
  })
  const settings = parseResponse(settingsResponseSchema, response.data)
  return {
    hasWebhookUrl: (settings.webhookUrl ?? '').trim() !== '',
    isIncomingDisabled: settings.incomingWebhook === 'no',
  }
}
