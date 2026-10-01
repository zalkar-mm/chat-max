import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

import { CSP_META_CONTENT, SECURITY_HEADERS, toHeadersFile } from './config/security-headers.ts'

/** Заголовки безопасности в `dist/_headers` для хостинга статики. */
const securityHeadersFile = (): Plugin => ({
  name: 'security-headers-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: '_headers', source: toHeadersFile(SECURITY_HEADERS) })
  },
})

/**
 * CSP ещё и `<meta>` в собранном index.html: хостинг без своих заголовков тоже
 * ограничивает скрипты и запросы. В dev не ставим — мешал бы HMR и MSW.
 */
const cspMeta = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP_META_CONTENT },
      injectTo: 'head-prepend',
    },
  ],
})

/** Превью ссылки в мессенджерах. Telegram берёт только абсолютный адрес картинки. */
const socialMeta = (): Plugin => ({
  name: 'social-meta',
  apply: 'build',
  transformIndexHtml: () => {
    // SITE_URL задаётся вручную; на Netlify адрес сайта приходит в URL.
    const siteUrl = process.env.SITE_URL ?? process.env.URL
    const image = new URL(
      'og-cover.png',
      siteUrl ? `${siteUrl.replace(/\/$/, '')}/` : 'https://localhost/',
    ).href
    const meta = (property: string, content: string) => ({
      tag: 'meta',
      attrs: { property, content },
      injectTo: 'head' as const,
    })
    return [
      meta('og:type', 'website'),
      meta('og:title', 'MAX-чат — GREEN-API'),
      meta('og:description', 'Отправка и получение текстовых сообщений в MAX через GREEN-API'),
      ...(siteUrl ? [meta('og:image', image), meta('twitter:card', 'summary_large_image')] : []),
    ]
  },
})

export default defineConfig({
  // Подпапка сайта, если приложение живёт не в корне (например, /<репозиторий>/).
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), securityHeadersFile(), cspMeta(), socialMeta()],
  // Локальный просмотр сборки — с теми же заголовками, что на хостинге.
  preview: { headers: SECURITY_HEADERS },
  build: { sourcemap: false },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // e2e-сценарии гоняет Playwright (`npm run test:e2e`), Vitest их не трогает.
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Порог — на доменную логику и слой API. UI покрыт компонентными тестами отдельно.
      include: [
        'src/entities/**/{model,lib,api}/**/*.ts',
        'src/features/**/model/**/*.ts',
        'src/shared/api/**/*.ts',
        'src/shared/lib/**/*.ts',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/*.types.ts', '**/*-dto.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
})
