// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    // Block service worker registration so SW caching does not interfere with
    // test assertions about DOM attributes across retries.
    serviceWorkers: 'block',
  },

  // Start the static file server from the repo root before running any tests.
  // Playwright waits for the URL to respond before proceeding.
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    cwd: '..',          // repo root (one level up from tests/)
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },

  projects: [
    // Desktop
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
