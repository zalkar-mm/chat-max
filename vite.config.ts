import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
      // Порог — на доменную логику и слой API (sprint-4, задача 7). UI покрыт компонентными тестами отдельно.
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
