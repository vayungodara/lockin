// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const deployedURL = process.env.E2E_BASE_URL;
const localURL = 'http://localhost:3100';

/**
 * Playwright configuration for LockIn e2e tests.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  testIgnore: '**/unit/**',
  testMatch: '*.spec.js',

  /* Maximum time one test can run */
  timeout: 30_000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 5_000,
  },

  /* Limit browser processes on small orbs and CI runners. */
  fullyParallel: true,
  workers: 2,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter */
  reporter: 'html',

  /* Shared settings for all projects */
  use: {
    baseURL: deployedURL || localURL,

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

  /* Test the production build, never an unrelated dev server. These anonymous
   * flows need a syntactically valid URL/key, not a running Supabase backend.
   * Explicit overrides keep tests away from real Supabase projects and secrets.
   * E2E_BASE_URL runs the same read-only smoke suite against a deployment. */
  webServer: deployedURL ? undefined : {
    command: 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3100',
    url: localURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'lockin-e2e-not-a-real-key',
      NEXT_PUBLIC_APP_URL: localURL,
    },
  },
});
