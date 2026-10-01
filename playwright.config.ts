import { defineConfig, devices } from '@playwright/test'

// Порт фиксированный и отдельный от `npm run dev`, чтобы e2e не цеплялись к открытому dev-серверу.
const PORT = 5179
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  // Моки живут в памяти вкладки, но dev-сервер один: параллельные воркеры замедляют HMR-сборку и дают флаки.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  },
  projects: [
    // Браузер — `npx playwright install chromium` (в CI — с `--with-deps`).
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: { VITE_API_MOCKS: 'true' },
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
})
