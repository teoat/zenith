// e2e/web/settings.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Settings and Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to settings
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL('/settings');
  });

  test('should display settings dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="settings-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tabs"]')).toBeVisible();
  });

  test('should update user profile', async ({ page }) => {
    // Switch to profile tab
    await page.click('[data-testid="profile-tab"]');

    // Update profile information
    await page.fill('[data-testid="full-name-input"]', 'Updated Analyst Name');
    await page.fill('[data-testid="email-input"]', 'updated.analyst@company.com');
    await page.fill('[data-testid="phone-input"]', '+1-555-0123');

    // Save changes
    await page.click('[data-testid="save-profile-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="profile-update-success"]')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.click('[data-testid="security-tab"]');

    // Fill password change form
    await page.fill('[data-testid="current-password-input"]', TEST_USERS.analyst.password);
    await page.fill('[data-testid="new-password-input"]', 'NewSecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePass123!');

    // Submit password change
    await page.click('[data-testid="change-password-button"]');

    // Verify success
    await expect(page.locator('[data-testid="password-change-success"]')).toBeVisible();
  });

  test('should configure notification preferences', async ({ page }) => {
    await page.click('[data-testid="notifications-tab"]');

    // Configure email notifications
    await page.check('[data-testid="email-case-assigned"]');
    await page.check('[data-testid="email-case-updated"]');
    await page.uncheck('[data-testid="email-weekly-report"]');

    // Configure in-app notifications
    await page.check('[data-testid="inapp-high-priority"]');
    await page.check('[data-testid="inapp-mentions"]');

    // Save preferences
    await page.click('[data-testid="save-notifications-button"]');

    // Verify success
    await expect(page.locator('[data-testid="notifications-saved"]')).toBeVisible();
  });

  test('should configure theme settings', async ({ page }) => {
    await page.click('[data-testid="appearance-tab"]');

    // Change theme
    await page.selectOption('[data-testid="theme-select"]', 'dark');

    // Configure other appearance settings
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.selectOption('[data-testid="timezone-select"]', 'America/New_York');
    await page.selectOption('[data-testid="date-format-select"]', 'MM/DD/YYYY');

    // Save settings
    await page.click('[data-testid="save-appearance-button"]');

    // Verify theme change (body should have dark class)
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should configure dashboard preferences', async ({ page }) => {
    await page.click('[data-testid="dashboard-tab"]');

    // Configure dashboard widgets
    await page.check('[data-testid="show-case-metrics"]');
    await page.check('[data-testid="show-activity-feed"]');
    await page.uncheck('[data-testid="show-quick-actions"]');

    // Configure refresh interval
    await page.selectOption('[data-testid="refresh-interval-select"]', '30');

    // Configure default date range
    await page.selectOption('[data-testid="default-date-range"]', '7d');

    // Save preferences
    await page.click('[data-testid="save-dashboard-button"]');

    // Verify success
    await expect(page.locator('[data-testid="dashboard-saved"]')).toBeVisible();
  });

  test('should configure case management settings', async ({ page }) => {
    await page.click('[data-testid="case-management-tab"]');

    // Configure case assignment
    await page.check('[data-testid="auto-assign-cases"]');
    await page.selectOption('[data-testid="default-priority"]', 'medium');

    // Configure case templates
    await page.check('[data-testid="enable-templates"]');
    await page.selectOption('[data-testid="default-template"]', 'fraud-investigation');

    // Configure notifications
    await page.check('[data-testid="notify-on-assignment"]');
    await page.check('[data-testid="notify-on-status-change"]');

    // Save settings
    await page.click('[data-testid="save-case-settings-button"]');

    // Verify success
    await expect(page.locator('[data-testid="case-settings-saved"]')).toBeVisible();
  });

  test('should configure evidence settings', async ({ page }) => {
    await page.click('[data-testid="evidence-tab"]');

    // Configure file upload settings
    await page.fill('[data-testid="max-file-size-input"]', '50');
    await page.check('[data-testid="auto-process-evidence"]');
    await page.selectOption('[data-testid="default-processing"]', 'ocr');

    // Configure allowed file types
    await page.check('[data-testid="allow-pdf"]');
    await page.check('[data-testid="allow-images"]');
    await page.check('[data-testid="allow-documents"]');
    await page.uncheck('[data-testid="allow-executables"]');

    // Configure retention settings
    await page.fill('[data-testid="retention-days-input"]', '365');

    // Save settings
    await page.click('[data-testid="save-evidence-settings-button"]');

    // Verify success
    await expect(page.locator('[data-testid="evidence-settings-saved"]')).toBeVisible();
  });

  test('should configure integration settings', async ({ page }) => {
    await page.click('[data-testid="integrations-tab"]');

    // Configure API settings
    await page.check('[data-testid="enable-api-access"]');
    await page.fill('[data-testid="api-rate-limit-input"]', '1000');

    // Configure webhook settings
    await page.check('[data-testid="enable-webhooks"]');
    await page.fill('[data-testid="webhook-url-input"]', 'https://api.company.com/webhooks');

    // Configure export settings
    await page.check('[data-testid="enable-auto-export"]');
    await page.selectOption('[data-testid="export-format"]', 'json');
    await page.selectOption('[data-testid="export-frequency"]', 'daily');

    // Save settings
    await page.click('[data-testid="save-integration-settings-button"]');

    // Verify success
    await expect(page.locator('[data-testid="integration-settings-saved"]')).toBeVisible();
  });

  test('should export user data', async ({ page }) => {
    await page.click('[data-testid="privacy-tab"]');

    // Click export data button
    await page.click('[data-testid="export-data-button"]');

    // Confirm export
    await page.click('[data-testid="confirm-export-button"]');

    // Verify download starts
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('user-data');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should delete user account', async ({ page }) => {
    await page.click('[data-testid="privacy-tab"]');

    // Click delete account button
    await page.click('[data-testid="delete-account-button"]');

    // Confirm account deletion
    await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
    await page.click('[data-testid="confirm-delete-button"]');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should reset settings to defaults', async ({ page }) => {
    // Click reset button
    await page.click('[data-testid="reset-settings-button"]');

    // Confirm reset
    await page.click('[data-testid="confirm-reset-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="settings-reset-success"]')).toBeVisible();

    // Verify some settings are back to defaults
    await page.click('[data-testid="appearance-tab"]');
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('light');
  });

  test('should import settings', async ({ page }) => {
    // Create a test settings file
    const settingsFile = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        inApp: true
      }
    };

    // Click import settings button
    await page.click('[data-testid="import-settings-button"]');

    // Upload settings file
    const fileInput = page.locator('[data-testid="settings-file-input"]');
    await fileInput.setInputFiles({
      name: 'settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(settingsFile))
    });

    // Confirm import
    await page.click('[data-testid="confirm-import-button"]');

    // Verify success
    await expect(page.locator('[data-testid="settings-imported"]')).toBeVisible();

    // Verify settings were applied
    await page.click('[data-testid="appearance-tab"]');
    await expect(page.locator('[data-testid="theme-select"]')).toHaveValue('dark');
  });
});