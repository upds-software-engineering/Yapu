import { defineConfig, devices } from '@playwright/test';

const PUERTO = 9500;
/** El sitio se publica bajo /Yapu/ (base de Astro), también en local. */
const BASE_URL = process.env.YAPU_BASE_URL ?? `http://localhost:${PUERTO}/Yapu/`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'reports/junit/playwright.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, isMobile: false }
    },
    {
      name: 'Pixel 5',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
