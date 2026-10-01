import { GREEN_API_HOSTS } from '../src/shared/config/green-api-hosts.ts'

/**
 * Заголовки безопасности продакшена (sprint-4, задача 6). Один источник: `vite preview` отдаёт их
 * локально, сборка кладёт их в `dist/_headers` (формат Netlify / Cloudflare Pages).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Скрипты — только наши: тема выставляется файлом /theme-init.js, без inline-кода.
  "script-src 'self'",
  // 'unsafe-inline' для стилей: блокировка прокрутки под модалкой (Radix) вставляет <style> с вычисленной
  // шириной полосы прокрутки — хешем его не описать. Скрипты при этом остаются строго своими.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  // Запросы — только к GREEN-API; тот же список проверяет форма входа.
  `connect-src 'self' ${GREEN_API_HOSTS.map((host) => `https://*.${host}`).join(' ')}`,
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
