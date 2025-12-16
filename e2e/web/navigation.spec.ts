// e2e/web/navigation.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible();
  });

  test('should navigate to cases page', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');
    await expect(page).toHaveURL('/cases');
    await expect(page.locator('[data-testid="cases-list"]')).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();
  });

  test('should handle breadcrumb navigation', async ({ page }) => {
    // Navigate to cases
    await page.click('[data-testid="nav-cases"]');
    await expect(page).toHaveURL('/cases');

    // Click on a case (assuming one exists)
    const caseItem = page.locator('[data-testid="case-item"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible();

      // Test breadcrumb navigation
      await page.click('[data-testid="breadcrumb-cases"]');
      await expect(page).toHaveURL('/cases');
    }
  });

  test('should handle browser back/forward', async ({ page }) => {
    // Start at dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to cases
    await page.click('[data-testid="nav-cases"]');
    await expect(page).toHaveURL('/cases');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/cases');
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Test direct navigation to different routes
    await page.goto('/cases');
    await expect(page).toHaveURL('/cases');

    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});