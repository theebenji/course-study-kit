import { defineConfig, devices } from '@playwright/test'

// E2E runs against a fresh copy of the committed fixture course, never your real
// my-progress/. The copy is rebuilt on every run because the tests write to it.
const env = {
  PROGRESS_DIR: '.e2e-progress',
  STUDY_SERVER_PORT: '5184',
  STUDY_TODAY: '2026-10-13',
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5183',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'rm -rf .e2e-progress && cp -R tests/fixtures/progress .e2e-progress && tsx server/index.ts',
      url: 'http://127.0.0.1:5184/api/health',
      env,
      reuseExistingServer: false,
    },
    {
      command: 'vite --port 5183 --strictPort',
      url: 'http://localhost:5183',
      env,
      reuseExistingServer: false,
    },
  ],
})
