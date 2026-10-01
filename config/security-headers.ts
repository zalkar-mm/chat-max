/**
 * Заголовки безопасности продакшена (sprint-4, задача 6). Один источник: `vite preview` отдаёт их
 * локально, сборка кладёт их в `dist/_headers` (формат Netlify / Cloudflare Pages).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Скрипты — только наши: тема выставляется файлом /theme-init.js, без inline-кода.
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  // Запросы — только к GREEN-API (у инстансов MAX бывают оба домена: *.green-api.com и *.greenapi.com).
  "connect-src 'self' https://*.green-api.com https://*.greenapi.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

/** Файл `_headers`: правило на все пути. */
export const toHeadersFile = (headers: Readonly<Record<string, string>>) =>
  ['/*', ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`), ''].join('\n')
