import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e/web', // E2E tests in root e2e/web directory
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'json' : 'html',
  use: {
    baseURL: 'http://localhost:5173', // Frontend URL for E2E tests
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    ignoreHTTPSErrors: true,
  },
  // Configure test environment
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    ...(process.env.CI ? [] : [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }])
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
