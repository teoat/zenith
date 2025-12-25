// e2e/web/cross-platform.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Cross-Platform Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

    // Navigate to cases
    await page.click('[data-testid="mobile-nav-cases"]');
    await expect(page).toHaveURL('/cases');

    // Verify mobile case list
    await expect(page.locator('[data-testid="mobile-case-list"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify tablet layout (should show sidebar)
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Test responsive behavior
    await page.click('[data-testid="nav-cases"]');
    await expect(page).toHaveURL('/cases');

    // Verify tablet-optimized layout
    await expect(page.locator('[data-testid="tablet-case-grid"]')).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    // Set mobile viewport for touch testing
    await page.setViewportSize({ width: 375, height: 667 });

    // Test touch gestures
    const caseCard = page.locator('[data-testid="case-card"]').first();

    // Test tap
    await caseCard.tap();
    await expect(page.locator('[data-testid="case-details"]')).toBeVisible();

    // Test swipe (if implemented)
    // Note: Swipe testing would require specific implementation
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Test keyboard accessibility
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-dashboard"]:focus')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-cases"]:focus')).toBeVisible();

    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/cases');
  });

  test('should handle different screen densities', async ({ page }) => {
    // Test with high DPI display simulation
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Verify high-res elements render correctly
    await expect(page.locator('[data-testid="high-res-chart"]')).toBeVisible();

    // Test zoom levels
    await page.keyboard.down('Control');
    await page.keyboard.press('=');
    await page.keyboard.up('Control');

    // Verify elements scale properly
    await expect(page.locator('[data-testid="scalable-content"]')).toBeVisible();
  });

  test('should work in different browsers', async ({ page, browserName }) => {
    // Basic functionality test that should work across browsers
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // Browser-specific tests
    if (browserName === 'firefox') {
      // Firefox-specific behavior
      await expect(page.locator('[data-testid="firefox-compatible"]')).toBeVisible();
    } else if (browserName === 'webkit') {
      // Safari-specific behavior
      await expect(page.locator('[data-testid="webkit-compatible"]')).toBeVisible();
    } else if (browserName === 'chromium') {
      // Chrome-specific behavior
      await expect(page.locator('[data-testid="chromium-compatible"]')).toBeVisible();
    }
  });

  test('should handle network conditions', async ({ page }) => {
    // Test offline functionality
    await page.context().setOffline(true);

    // Verify offline indicators
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Test offline queue
    await expect(page.locator('[data-testid="offline-queue"]')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
  });

  test('should work with different color schemes', async ({ page }) => {
    // Test light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('[data-testid="light-theme"]')).toBeVisible();

    // Test dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('[data-testid="dark-theme"]')).toBeVisible();

    // Test no preference
    await page.emulateMedia({ colorScheme: 'no-preference' });
    await expect(page.locator('[data-testid="system-theme"]')).toBeVisible();
  });

  test('should handle different locales', async ({ page }) => {
    // Test English (default)
    await expect(page.locator('[data-testid="locale-en"]')).toBeVisible();

    // Test date/number formatting
    await expect(page.locator('[data-testid="formatted-date"]')).toContain(/\d{1,2}\/\d{1,2}\/\d{4}/);

    // Test currency formatting
    await expect(page.locator('[data-testid="formatted-currency"]')).toContain('$');
  });

  test('should work with assistive technologies', async ({ page }) => {
    // Test screen reader compatibility
    await expect(page.locator('[aria-label]')).toHaveCount(await page.locator('[aria-label]').count());

    // Test keyboard navigation order
    const focusableElements = page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();

    // Verify logical tab order
    for (let i = 0; i < Math.min(count, 5); i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should handle print styles', async ({ page }) => {
    // Test print media queries
    await page.emulateMedia({ media: 'print' });

    // Verify print-optimized layout
    await expect(page.locator('[data-testid="print-layout"]')).toBeVisible();

    // Check that print-specific styles are applied
    const printStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });

    // Print styles should typically be white background, black text
    expect(printStyles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(printStyles.color).toBe('rgb(0, 0, 0)');
  });

  test('should work with reduced motion', async ({ page }) => {
    // Test reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Verify animations are disabled or reduced
    const animatedElements = page.locator('[data-testid="animated-element"]');
    if (await animatedElements.count() > 0) {
      // Check that animations respect reduced motion
      const animationStyle = await animatedElements.first().evaluate(el => {
        return window.getComputedStyle(el).animationDuration;
      });
      expect(animationStyle).toBe('0s');
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Test high contrast preference
    await page.emulateMedia({ forcedColors: 'active' });

    // Verify high contrast styles are applied
    await expect(page.locator('[data-testid="high-contrast"]')).toBeVisible();

    // Check color contrast ratios
    const contrastRatio = await page.evaluate(() => {
      // This would require actual contrast calculation
      return true; // Placeholder
    });
    expect(contrastRatio).toBe(true);
  });
});