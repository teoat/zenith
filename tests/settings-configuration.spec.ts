/**
 * Settings and Configuration E2E Tests
 * Tests all settings panels and configuration options
 */
import { test, expect } from '@playwright/test';

test.describe('Settings and Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Navigate to settings
    await page.goto('/settings');
  });

  test.describe('General Settings', () => {
    test('displays general settings panel', async ({ page }) => {
      await expect(page.locator('text=General Settings')).toBeVisible();
      await expect(page.locator('text=Basic application preferences')).toBeVisible();
    });

    test('theme selection works', async ({ page }) => {
      // Click on theme select
      await page.click('[data-testid="theme-select"]');

      // Select dark theme
      await page.click('text=Dark');

      // Theme should change (check body class or visual indicator)
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Theme persists after reload
      await page.reload();
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('language selection works', async ({ page }) => {
      // Language switcher should be present
      await expect(page.locator('[aria-label="Select your preferred language"]')).toBeVisible();

      // Change language to Indonesian
      await page.click('[aria-label="Select your preferred language"]');
      await page.click('text=Bahasa Indonesia');

      // UI should change to Indonesian
      await expect(page.locator('text=Pengaturan')).toBeVisible();
      await expect(page.locator('text=Preferensi aplikasi dasar')).toBeVisible();
    });

    test('timezone selection persists', async ({ page }) => {
      const timezoneSelect = page.locator('[data-testid="timezone-select"]');
      await timezoneSelect.selectOption('America/New_York');

      // Reload and verify persistence
      await page.reload();
      await expect(timezoneSelect).toHaveValue('America/New_York');
    });
  });

  test.describe('Notification Settings', () => {
    test('notification preferences can be toggled', async ({ page }) => {
      // Navigate to notifications tab
      await page.click('text=Notifications');

      // Email notifications toggle
      const emailToggle = page.locator('[data-testid="email-notifications-toggle"]');
      await expect(emailToggle).toBeVisible();

      // Toggle it on/off
      await emailToggle.click();
      await expect(emailToggle).toBeChecked();

      await emailToggle.click();
      await expect(emailToggle).not.toBeChecked();
    });

    test('alert notification settings work', async ({ page }) => {
      await page.click('text=Notifications');

      // High-risk alerts toggle
      const alertToggle = page.locator('[data-testid="alert-notifications-toggle"]');
      await alertToggle.click();

      // Should show additional alert preferences
      await expect(page.locator('text=Alert Preferences')).toBeVisible();
    });

    test('notification settings persist', async ({ page }) => {
      await page.click('text=Notifications');

      // Change multiple settings
      await page.click('[data-testid="email-notifications-toggle"]');
      await page.click('[data-testid="push-notifications-toggle"]');

      // Reload and verify persistence
      await page.reload();
      await page.click('text=Notifications');

      await expect(page.locator('[data-testid="email-notifications-toggle"]')).toBeChecked();
      await expect(page.locator('[data-testid="push-notifications-toggle"]')).toBeChecked();
    });
  });

  test.describe('Security Settings', () => {
    test('security settings panel loads', async ({ page }) => {
      await page.click('text=Security');

      await expect(page.locator('text=Security Settings')).toBeVisible();
      await expect(page.locator('text=Configure security and access preferences')).toBeVisible();
    });

    test('auto-lock settings work', async ({ page }) => {
      await page.click('text=Security');

      const autoLockToggle = page.locator('[data-testid="auto-lock-toggle"]');
      await autoLockToggle.click();

      // Should show timeout input
      await expect(page.locator('[data-testid="session-timeout-input"]')).toBeVisible();

      // Set timeout value
      await page.fill('[data-testid="session-timeout-input"]', '30');

      // Save settings
      await page.click('button:has-text("Save")');

      // Verify success message
      await expect(page.locator('text=Settings saved successfully')).toBeVisible();
    });

    test('two-factor authentication setup', async ({ page }) => {
      await page.click('text=Security');

      const twoFactorToggle = page.locator('[data-testid="two-factor-toggle"]');

      // Initially should be off
      await expect(twoFactorToggle).not.toBeChecked();

      // Click to enable
      await twoFactorToggle.click();

      // Should show 2FA setup wizard
      await expect(page.locator('text=Set up Two-Factor Authentication')).toBeVisible();
    });

    test('password policy settings', async ({ page }) => {
      await page.click('text=Security');

      await page.click('text=Password Policy');

      // Should show password requirements
      await expect(page.locator('text=Minimum length')).toBeVisible();
      await expect(page.locator('text=Require special characters')).toBeVisible();

      // Change requirements
      await page.fill('[data-testid="min-length-input"]', '12');
      await page.click('[data-testid="special-chars-toggle"]');

      // Save changes
      await page.click('button:has-text("Update Policy")');
      await expect(page.locator('text=Password policy updated')).toBeVisible();
    });
  });

  test.describe('System Settings', () => {
    test('system configuration panel', async ({ page }) => {
      await page.click('text=System');

      await expect(page.locator('text=System Settings')).toBeVisible();
      await expect(page.locator('text=Advanced system configuration')).toBeVisible();
    });

    test('data retention settings', async ({ page }) => {
      await page.click('text=System');

      const retentionInput = page.locator('[data-testid="data-retention-input"]');
      await retentionInput.fill('90');

      await page.click('button:has-text("Save")');

      // Verify setting saved
      await expect(page.locator('text=Data retention updated to 90 days')).toBeVisible();
    });

    test('file size limits', async ({ page }) => {
      await page.click('text=System');

      const sizeLimitInput = page.locator('[data-testid="max-file-size-input"]');
      await sizeLimitInput.fill('50');

      await page.click('button:has-text("Save")');

      // Verify setting saved
      await expect(page.locator('text=Maximum file size updated')).toBeVisible();
    });

    test('API rate limiting', async ({ page }) => {
      await page.click('text=System');

      const rateLimitInput = page.locator('[data-testid="api-rate-limit-input"]');
      await rateLimitInput.fill('1000');

      await page.click('button:has-text("Save")');

      // Verify setting saved
      await expect(page.locator('text=API rate limit updated')).toBeVisible();
    });
  });

  test.describe('Accessibility Settings', () => {
    test('accessibility panel loads', async ({ page }) => {
      await page.click('text=Accessibility');

      await expect(page.locator('text=Accessibility')).toBeVisible();
      await expect(page.locator('text=Configure accessibility preferences')).toBeVisible();
    });

    test('font size adjustment works', async ({ page }) => {
      await page.click('text=Accessibility');

      // Change font size to large
      await page.click('[data-testid="font-size-large"]');

      // Body should have large font class
      await expect(page.locator('html')).toHaveClass(/font-large/);

      // Font size persists
      await page.reload();
      await expect(page.locator('html')).toHaveClass(/font-large/);
    });

    test('high contrast mode toggles', async ({ page }) => {
      await page.click('text=Accessibility');

      const contrastToggle = page.locator('[data-testid="high-contrast-toggle"]');
      await contrastToggle.click();

      // Should apply high contrast class
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
    });

    test('reduced motion setting works', async ({ page }) => {
      await page.click('text=Accessibility');

      const motionToggle = page.locator('[data-testid="reduced-motion-toggle"]');
      await motionToggle.click();

      // Should apply reduced motion class
      await expect(page.locator('html')).toHaveClass(/reduced-motion/);
    });

    test('screen reader support indicators', async ({ page }) => {
      await page.click('text=Accessibility');

      // Screen reader toggle should exist
      await expect(page.locator('[data-testid="screen-reader-toggle"]')).toBeVisible();

      // Should have proper ARIA labels throughout the form
      const ariaLabels = await page.locator('[aria-label]').count();
      expect(ariaLabels).toBeGreaterThan(10);
    });
  });

  test.describe('Settings Persistence and Sync', () => {
    test('settings sync across browser sessions', async ({ page, context }) => {
      await page.click('text=General');

      // Change theme
      await page.click('[data-testid="theme-select"]');
      await page.click('text=Dark');

      // Open new tab
      const page2 = await context.newPage();
      await page2.goto('/settings');

      // Settings should be synced
      await expect(page2.locator('html')).toHaveClass(/dark/);
    });

    test('settings export/import works', async ({ page }) => {
      // Export settings
      await page.click('[data-testid="export-settings"]');

      // Should download a file
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toMatch(/settings.*\.json/);

      // Import settings (would need a test file)
      // This is complex to test fully in E2E
    });

    test('settings validation prevents invalid values', async ({ page }) => {
      await page.click('text=System');

      // Try invalid data retention value
      await page.fill('[data-testid="data-retention-input"]', '-1');

      await page.click('button:has-text("Save")');

      // Should show validation error
      await expect(page.locator('text=Data retention must be positive')).toBeVisible();
    });
  });

  test.describe('Settings Performance', () => {
    test('settings load quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/settings', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // 2 seconds
    });

    test('setting changes apply immediately', async ({ page }) => {
      const startTime = Date.now();

      await page.click('[data-testid="theme-select"]');
      await page.click('text=Dark');

      const changeTime = Date.now() - startTime;
      expect(changeTime).toBeLessThan(500); // 500ms
    });
  });
});