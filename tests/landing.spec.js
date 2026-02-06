// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/LockIn/);
  });

  test('displays the logo in the navbar', async ({ page }) => {
    const logo = page.locator('nav img[alt="LockIn"]');
    await expect(logo).toBeVisible();
  });

  test('displays the hero headline', async ({ page }) => {
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('tomorrow');
    await expect(heroTitle).toContainText('locking in');
  });

  test('displays the hero description / tagline', async ({ page }) => {
    const description = page.getByText('The app that makes sure tomorrow actually comes.');
    await expect(description).toBeVisible();
  });

  test('has a "Start Locking In" CTA button', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /Start Locking In/i }).first();
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute('href', '/dashboard');
  });

  test('has a "See How It Works" button', async ({ page }) => {
    const howItWorksButton = page.getByRole('link', { name: /See How It Works/i });
    await expect(howItWorksButton).toBeVisible();
    await expect(howItWorksButton).toHaveAttribute('href', '#how-it-works');
  });

  test('has a "Get Started" button in the navbar', async ({ page }) => {
    const getStartedButton = page.getByRole('button', { name: /Get Started/i });
    await expect(getStartedButton).toBeVisible();
  });

  test('displays the features section with all 6 features', async ({ page }) => {
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toBeVisible();

    const featureTitles = [
      'Personal Pacts',
      'Group Accountability',
      'Task Ownership',
      'Activity Feed',
      'Focus Timer',
      'Streaks & Stats',
    ];

    for (const title of featureTitles) {
      const featureHeading = featuresSection.getByText(title);
      await expect(featureHeading).toBeVisible();
    }
  });

  test('displays the "How it Works" section with 3 steps', async ({ page }) => {
    const howItWorksSection = page.locator('#how-it-works');
    await expect(howItWorksSection).toBeVisible();

    const stepTitles = [
      'Sign in with Google',
      'Create your first pact',
      'Lock in and deliver',
    ];

    for (const title of stepTitles) {
      const stepHeading = howItWorksSection.getByText(title);
      await expect(stepHeading).toBeVisible();
    }
  });

  test('displays the interactive app preview section', async ({ page }) => {
    // The mock browser frame with the dashboard preview
    const browserFrame = page.getByText('lockin.app/dashboard');
    await expect(browserFrame).toBeVisible();
  });

  test('displays the bottom CTA section', async ({ page }) => {
    const ctaHeading = page.getByText('Ready to stop making excuses?');
    await expect(ctaHeading).toBeVisible();
  });

  test('displays the footer with branding', async ({ page }) => {
    const footerTagline = page.getByText('The app that makes sure tomorrow actually comes.').last();
    await expect(footerTagline).toBeVisible();

    const footerBuiltBy = page.getByText(/Built with frustration and caffeine/);
    await expect(footerBuiltBy).toBeVisible();
  });

  test('navbar links point to correct sections', async ({ page }) => {
    const featuresLink = page.locator('nav a[href="#features"]');
    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveText('Features');

    const howItWorksLink = page.locator('nav a[href="#how-it-works"]');
    await expect(howItWorksLink).toBeVisible();
    await expect(howItWorksLink).toHaveText('How it Works');
  });
});
