import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('Dashboard should match baseline', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:5173/dashboard');

    // Wait for content to load
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('dashboard-baseline.png', {
      fullPage: true,
      threshold: 0.1, // Allow 10% difference
    });
  });

  test('Case table should match baseline', async ({ page }) => {
    await page.goto('http://localhost:5173/cases');

    await page.waitForSelector('[data-testid="case-table"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="case-table"]')).toHaveScreenshot('case-table-baseline.png', {
      threshold: 0.05,
    });
  });

  test('Chart components should match baseline', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');

    // Wait for charts to render
    await page.waitForSelector('.recharts-wrapper', { timeout: 10000 });

    await expect(page.locator('.recharts-wrapper').first()).toHaveScreenshot('chart-baseline.png', {
      threshold: 0.2, // Charts may have slight variations
    });
  });

  test('RTL layout should match baseline', async ({ page }) => {
    // Set language to Arabic for RTL test
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { value: 'ar' });
    });

    await page.goto('http://localhost:5173/dashboard');

    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 10000 });

    await expect(page).toHaveScreenshot('dashboard-rtl-baseline.png', {
      fullPage: true,
      threshold: 0.1,
    });
  });
});