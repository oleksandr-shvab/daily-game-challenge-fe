import { defineConfig, devices } from '@playwright/test'
import { backendEnv } from './e2e/support/backend-env'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'en-US',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Mini'], browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'bash e2e/start-backend.sh',
      url: 'http://localhost:8000/readyz',
      env: backendEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
    },
  ],
})
