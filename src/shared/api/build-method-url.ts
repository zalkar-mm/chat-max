import type { Credentials } from './credentials'

export type GreenApiMethod =
  'getStateInstance' | 'checkAccount' | 'sendMessage' | 'receiveNotification' | 'deleteNotification'

export function buildMethodUrl(credentials: Credentials, method: GreenApiMethod, suffix?: string) {
  const base = credentials.apiUrl.replace(/\/+$/, '')
  const path = `${base}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}`
  return suffix === undefined ? path : `${path}/${suffix}`
}
