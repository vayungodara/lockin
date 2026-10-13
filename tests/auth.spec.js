// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('unauthenticated user visiting /dashboard sees the sign-in page', async ({ page }) => {
    await page.goto('/dashboard');

    // dashboard/layout.js redirects unauthenticated users to /
    // The landing page is the sign-in entry point
    await expect(page).toHaveURL('/');

    // The landing page hero is visible
    const heroTitle = page.getByText('Stop lying to', { exact: false });
    await expect(heroTitle).toBeVisible();
  });

  test('sign-in page has a Google sign-in button', async ({ page }) => {
    await page.goto('/dashboard');

    // Redirects to landing page; wait for client-side loading to finish
    await expect(page).toHaveURL('/');

    // The primary CTA button triggers Google OAuth via handleSignIn
    // It is rendered as a <button> with text "Start Locking In"
    const ctaButton = page.getByRole('button', { name: /Start Locking In/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('sign-in page shows LockIn branding', async ({ page }) => {
    await page.goto('/dashboard');

    const logoText = page.getByText(/LockIn\.?/, { exact: false }).first();
    await expect(logoText).toBeVisible();
  });

  for (const path of ['pacts', 'groups', 'focus', 'stats', 'settings']) {
    test(`unauthenticated user cannot access /dashboard/${path}`, async ({ page }) => {
      const response = await page.goto(`/dashboard/${path}`);
      expect(response.status()).toBe(200);
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('button', { name: /Start Locking In/i }).first()).toBeVisible();
    });
  }

  test('auth callback without a code redirects to the error route', async ({ request, baseURL }) => {
    const response = await request.get('/auth/callback', { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(new URL('/auth/auth-code-error', baseURL).href);
  });

  test('cron endpoints reject unauthenticated requests', async ({ request }) => {
    for (const path of ['send-reminders', 'check-streak-risk', 'check-streak-breaks', 'cleanup']) {
      const response = await request.get(`/api/cron/${path}`);
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    }
  });
});
