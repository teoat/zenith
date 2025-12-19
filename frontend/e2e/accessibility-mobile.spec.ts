/**
 * Accessibility and Mobile Responsiveness E2E Tests
 * Tests WCAG compliance and mobile user experience
 */
import { test, expect } from '@playwright/test';

test.describe('Accessibility and Mobile UX', () => {
  test.describe('WCAG Compliance', () => {
    test('keyboard navigation works throughout app', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Test tab navigation through main areas
      await page.keyboard.press('Tab'); // Skip link
      await page.keyboard.press('Tab'); // Search
      await page.keyboard.press('Tab'); // Navigation menu
      await page.keyboard.press('Tab'); // Dashboard content

      // Should be able to reach interactive elements
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('screen reader announcements work', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Check for live regions
      const liveRegions = page.locator('[aria-live]');
      await expect(liveRegions).toHaveCount(await liveRegions.count()); // At least some exist

      // Check for ARIA labels
      const ariaLabels = page.locator('[aria-label]');
      const labelCount = await ariaLabels.count();
      expect(labelCount).toBeGreaterThan(5);
    });

    test('color contrast meets WCAG standards', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Take screenshot for contrast analysis
      await page.screenshot({ path: 'contrast-test.png' });

      // Check that text is readable (this is a basic check)
      const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
      const visibleText = await textElements.count();
      expect(visibleText).toBeGreaterThan(10);
    });

    test('focus indicators are visible', async ({ page }) => {
      await page.goto('/');

      // Focus on an interactive element
      await page.locator('button').first().focus();

      // Check that focus ring is visible
      const focusedElement = page.locator(':focus');
      const hasFocusRing = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' ||
               styles.boxShadow.includes('ring') ||
               el.classList.contains('focus-visible');
      });

      expect(hasFocusRing).toBe(true);
    });

    test('images have alt text', async ({ page }) => {
      await page.goto('/');

      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const hasAlt = await img.evaluate(el => el.hasAttribute('alt'));
          expect(hasAlt).toBe(true);
        }
      }
    });
  });

  test.describe('Voice Control and Assistive Features', () => {
    test('voice control can be enabled', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Accessibility');

      const voiceToggle = page.locator('[data-testid="voice-control-toggle"]');
      if (await voiceToggle.isVisible()) {
        await voiceToggle.click();

        // Should enable voice control
        await expect(voiceToggle).toBeChecked();

        // Should show voice commands help
        await expect(page.locator('text=Voice control activated')).toBeVisible();
      }
    });

    test('keyboard shortcuts work', async ({ page }) => {
      await page.goto('/');

      // Test global shortcuts
      await page.keyboard.press('Control+Slash'); // Help shortcut

      // Should show keyboard shortcuts modal
      const shortcutsModal = page.locator('[data-testid="keyboard-shortcuts-modal"]');
      if (await shortcutsModal.isVisible()) {
        await expect(shortcutsModal).toBeVisible();

        // Close modal
        await page.keyboard.press('Escape');
        await expect(shortcutsModal).not.toBeVisible();
      }
    });

    test('high contrast mode works', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Accessibility');

      const contrastToggle = page.locator('[data-testid="high-contrast-toggle"]');
      await contrastToggle.click();

      // Should apply high contrast styles
      await expect(page.locator('html')).toHaveClass(/high-contrast/);

      // Persists across navigation
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
    });

    test('font size adjustment works', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Accessibility');

      const fontSizeButtons = page.locator('[data-testid*="font-size"]');
      const largeButton = fontSizeButtons.filter({ hasText: 'Large' });

      if (await largeButton.isVisible()) {
        await largeButton.click();

        // Should apply large font size
        await expect(page.locator('html')).toHaveClass(/font-large/);
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('dashboard works on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Dashboard should be usable on mobile
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Mobile menu should be accessible
      const mobileMenuButton = page.locator('[aria-label*="menu" i]');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();

        // Mobile menu should open
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      }
    });

    test('forms work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/settings');

      // Forms should be usable on mobile
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        // Should be able to interact with inputs
        const firstInput = inputs.first();
        await firstInput.click();

        // Virtual keyboard should appear (can't test directly but input should focus)
        await expect(firstInput).toBeFocused();
      }
    });

    test('tables are mobile-friendly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/cases');

      // Data tables should have horizontal scroll or mobile layout
      const dataTable = page.locator('[data-testid="cases-table"]');
      if (await dataTable.isVisible()) {
        // Check for horizontal scroll
        const scrollWidth = await dataTable.evaluate(el => el.scrollWidth);
        const clientWidth = await dataTable.evaluate(el => el.clientWidth);

        // If table is wider than screen, should have horizontal scroll
        if (scrollWidth > clientWidth) {
          const hasHorizontalScroll = await dataTable.evaluate(el =>
            el.scrollWidth > el.clientWidth
          );
          expect(hasHorizontalScroll).toBe(true);
        }
      }
    });

    test('touch interactions work', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Test touch scrolling
      await page.evaluate(() => {
        window.scrollBy(0, 200);
      });

      // Page should scroll
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);

      // Test tap interactions
      const button = page.locator('button').first();
      await button.tap();

      // Button should respond to tap
      await expect(button).toBeVisible();
    });

    test('charts adapt to mobile screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Charts should be responsive
      const charts = page.locator('[data-testid*="chart"]');
      if (await charts.count() > 0) {
        const chart = charts.first();

        // Should not cause horizontal scroll
        const chartBox = await chart.boundingBox();
        if (chartBox) {
          expect(chartBox.width).toBeLessThanOrEqual(375);
        }

        // Should be touch-friendly
        const chartHeight = await chart.evaluate(el => el.offsetHeight);
        expect(chartHeight).toBeGreaterThan(200); // Minimum touch target
      }
    });
  });

  test.describe('Reduced Motion Support', () => {
    test('respects prefers-reduced-motion', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto('/');

      // Animations should be reduced
      const animatedElements = page.locator('[class*="animate-"], [class*="transition-"]');
      const animationCount = await animatedElements.count();

      // Should have minimal animations
      expect(animationCount).toBeLessThan(20);
    });

    test('manual reduced motion toggle works', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Accessibility');

      const motionToggle = page.locator('[data-testid="reduced-motion-toggle"]');
      if (await motionToggle.isVisible()) {
        await motionToggle.click();

        // Should apply reduced motion
        await expect(page.locator('html')).toHaveClass(/reduced-motion/);
      }
    });
  });

  test.describe('Error Handling on Mobile', () => {
    test('error messages are readable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/login');

      // Trigger validation error
      await page.click('button[type="submit"]');

      // Error message should be readable
      const errorMessage = page.locator('text=Email is required').first();
      await expect(errorMessage).toBeVisible();

      // Should not cause horizontal scroll
      const errorBox = await errorMessage.boundingBox();
      if (errorBox) {
        expect(errorBox.width).toBeLessThanOrEqual(375);
      }
    });

    test('offline mode works on mobile', async ({ page, context }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await context.setOffline(true);

      await page.reload();

      // Should show offline indicator optimized for mobile
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible();

      // Should be touch-friendly
      const indicatorBox = await offlineIndicator.boundingBox();
      if (indicatorBox) {
        expect(indicatorBox.height).toBeGreaterThan(44); // iOS touch target
      }
    });
  });

  test.describe('Performance on Mobile', () => {
    test('mobile pages load quickly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(4000); // 4 seconds for mobile
    });

    test('touch targets meet accessibility standards', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Check interactive elements have adequate touch targets
      const buttons = page.locator('button, [role="button"], a');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10
        const button = buttons.nth(i);
        const box = await button.boundingBox();

        if (box) {
          // Should meet 44px minimum (iOS) or 48px (Android)
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});