// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for LockIn e2e tests.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  /* Maximum time one test can run */
  timeout: 30_000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 5_000,
  },

  /* Run tests sequentially in CI, parallel locally */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter */
  reporter: 'html',

  /* Shared settings for all projects */
  use: {
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
  },

  /* Only test with Chromium for speed */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run the dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
