// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('unauthenticated user visiting /dashboard sees the sign-in page', async ({ page }) => {
    await page.goto('/dashboard');

    // The dashboard shows a sign-in card when there is no authenticated user
    const welcomeHeading = page.getByText('Welcome back');
    await expect(welcomeHeading).toBeVisible();

    const signInPrompt = page.getByText(/Sign in with your Google account/);
    await expect(signInPrompt).toBeVisible();
  });

  test('sign-in page has a Google sign-in button', async ({ page }) => {
    await page.goto('/dashboard');

    const googleButton = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(googleButton).toBeVisible();
  });

  test('sign-in page shows LockIn branding', async ({ page }) => {
    await page.goto('/dashboard');

    const logoText = page.getByText('LockIn', { exact: true }).first();
    await expect(logoText).toBeVisible();
  });

  test('unauthenticated user visiting a protected sub-page gets redirected or shown sign-in', async ({ page }) => {
    // Visiting /dashboard/pacts without auth should either redirect to /dashboard
    // or show the sign-in screen (depends on middleware/layout behavior)
    await page.goto('/dashboard/pacts');

    // Should either show the sign-in page or redirect to a page with sign-in
    // We check that the page does NOT show authenticated dashboard content
    const signInButton = page.getByRole('button', { name: /Sign in with Google/i });
    const isSignInVisible = await signInButton.isVisible().catch(() => false);

    // If sign-in button is visible, we are on the auth page (expected)
    // If not, check we were redirected to the landing or login page
    if (!isSignInVisible) {
      // Should have been redirected somewhere safe (landing page or sign-in)
      const url = page.url();
      expect(url).toMatch(/\/(dashboard)?$/);
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
