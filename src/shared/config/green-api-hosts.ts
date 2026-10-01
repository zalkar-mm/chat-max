/**
 * Домены API GREEN-API: у инстансов MAX встречаются оба. Один список для проверки адреса в форме входа
 * и для CSP продакшена (`config/security-headers.ts`) — запросы на другие домены браузер заблокирует.
 */
export const GREEN_API_HOSTS = ['green-api.com', 'greenapi.com'] as const

export function isGreenApiUrl(url: string) {
  try {
    const { protocol, hostname } = new URL(url)
    return (
      protocol === 'https:' &&
      GREEN_API_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
    )
  } catch {
    return false
  }
}
