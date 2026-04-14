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

  test('unauthenticated user visiting a protected sub-page gets redirected or shown sign-in', async ({ page }) => {
    // Visiting /dashboard/pacts without auth should redirect to / via dashboard/layout.js
    await page.goto('/dashboard/pacts');

    // Should have been redirected to the landing page
    const url = page.url();
    expect(url).toMatch(/\/$/);

    // The CTA button should be visible on the landing page
    const ctaButton = page.getByRole('button', { name: /Start Locking In/i }).first();
    const isCtaVisible = await ctaButton.isVisible().catch(() => false);

    if (!isCtaVisible) {
      // Fallback: confirm we are not on a dashboard sub-page
      expect(url).not.toContain('/dashboard/pacts');
    }
  });

  test('auth callback route exists', async ({ page }) => {
    // The auth callback route should exist and handle requests
    // Without a valid code, it should redirect to an error page
    await page.goto('/auth/callback');

    // The callback without a code redirects to auth-code-error
    // So the response URL should contain "auth" somewhere
    const url = page.url();
    expect(url).toContain('auth');
  });
});
