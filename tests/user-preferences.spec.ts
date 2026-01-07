/**
 * E2E Test: User Preferences & Customization
 * Tests theme switching, dashboard customization, notification settings
 */

import { test, expect } from '@playwright/test';

test.describe('User Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
  });

  test('theme switching (light/dark mode)', async ({ page }) => {
    await page.goto('/preferences');
    
    // Check current theme
    const currentTheme = await page.getAttribute('html', 'data-theme');
    
    // Toggle theme
    await page.click('[data-testid="theme-toggle"]');
    
    // Wait for theme change
    await page.waitForTimeout(500);
    
    // Verify theme changed
    const newTheme = await page.getAttribute('html', 'data-theme');
    expect(newTheme).not.toBe(currentTheme);
    
    // Check if dark mode styles applied
    if (newTheme === 'dark') {
      const bgColor = await page.evaluate(() => 
        window.getComputedStyle(document.body).backgroundColor
      );
      // Dark theme should have dark background
      expect(bgColor).toMatch(/rgb\(.*[0-3][0-9].*\)/);
    }
  });

  test('theme preference persists after logout', async ({ page }) => {
    await page.goto('/preferences');
    
    // Set dark mode
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');
    
    // Login again
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Theme should still be dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('customize dashboard widgets', async ({ page }) => {
    await page.goto('/preferences/dashboard');
    
    // Add a widget
    await page.click('button:has-text("Add Widget")');
    await page.click('[data-testid="widget-graph"]');
    
    // Verify widget added to list
    await expect(page.locator('[data-testid="active-widgets"]'))
      .toContainText('Graph Intelligence');
    
    // Reorder widgets
    const widget = page.locator('[data-testid="widget-item-graph"]');
    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(0, -100);
    await page.mouse.up();
    
    // Save preferences
    await page.click('button:has-text("Save Dashboard")');
    
    await expect(page.locator('[data-testid="toast-success"]'))
      .toContainText('saved');
  });

  test('notification preferences', async ({ page }) => {
    await page.goto('/preferences/notifications');
    
    // Toggle email notifications
    await page.click('[data-testid="email-notifications-toggle"]');
    
    // Set digest frequency
    await page.selectOption('[data-testid="digest-frequency"]', 'weekly');
    
    // Enable specific notification types
    await page.check('[data-testid="notify-case-assigned"]');
    await page.check('[data-testid="notify-sar-approved"]');
    await page.uncheck('[data-testid="notify-comment-added"]');
    
    // Save
    await page.click('button:has-text("Save Preferences")');
    
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    
    // Verify saved (refresh and check)
    await page.reload();
    await expect(page.locator('[data-testid="digest-frequency"]'))
      .toHaveValue('weekly');
  });

  test('language preference', async ({ page }) => {
    await page.goto('/preferences');
    
    // Change language
    await page.selectOption('[data-testid="language-select"]', 'es');
    
    await page.click('button:has-text("Save")');
    
    // UI should update to Spanish
    await expect(page.locator('h1')).toContainText(/Preferencias|Configuración/i);
  });

  test('dashboard layout preference', async ({ page }) => {
    await page.goto('/preferences/dashboard');
    
    // Select layout
    await page.click('[data-testid="layout-wide"]');
    
    await page.click('button:has-text("Save")');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Verify wide layout applied
    const dashboard = page.locator('[data-testid="dashboard-container"]');
    await expect(dashboard).toHaveClass(/layout-wide/);
  });

  test('default view preference', async ({ page }) => {
    await page.goto('/preferences');
    
    // Set default view to alerts
    await page.selectOption('[data-testid="default-view"]', 'alerts');
    
    await page.click('button:has-text("Save")');
    
    // Logout and login
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');
    
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should redirect to alerts
    await expect(page).toHaveURL('/alerts');
  });

  test('reset preferences to defaults', async ({ page }) => {
    await page.goto('/preferences');
    
    // Make some changes
    await page.click('[data-testid="theme-toggle"]');
    await page.selectOption('[data-testid="language-select"]', 'es');
    
    // Reset
    await page.click('button:has-text("Reset to Defaults")');
    
    // Confirm reset
    await page.click('button:has-text("Confirm Reset")');
    
    await expect(page.locator('[data-testid="toast-success"]'))
      .toContainText('reset');
    
    // Verify defaults restored
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('[data-testid="language-select"]'))
      .toHaveValue('en');
  });

  test('preferences API integration', async ({ page }) => {
    await page.goto('/preferences');
    
    // Monitor API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/users/me/preferences')) {
        apiCalls.push(request.method());
      }
    });
    
    // Load preferences (GET)
    await page.waitForTimeout(1000);
    expect(apiCalls).toContain('GET');
    
    // Update preferences (PUT)
    await page.click('[data-testid="theme-toggle"]');
    await page.click('button:has-text("Save")');
    
    await page.waitForTimeout(1000);
    expect(apiCalls).toContain('PUT');
  });

  test('accessibility settings', async ({ page }) => {
    await page.goto('/preferences/accessibility');
    
    // Enable high contrast
    await page.check('[data-testid="high-contrast-mode"]');
    
    // Increase font size
    await page.selectOption('[data-testid="font-size"]', 'large');
    
    // Enable reduced motion
    await page.check('[data-testid="reduced-motion"]');
    
    await page.click('button:has-text("Save")');
    
    // Verify settings applied
    await page.goto('/dashboard');
    
    const body = page.locator('body');
    await expect(body).toHaveClass(/high-contrast/);
    await expect(body).toHaveClass(/font-large/);
  });
});

test.describe('Theme Variations', () => {
  test('system theme detection', async ({ page, context }) => {
    await context.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.goto('/preferences');
    
    // Select system theme
    await page.click('[data-testid="theme-system"]');
    
    // Should match system (dark)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('accent color customization', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    await page.goto('/preferences/appearance');
    
    // Select accent color
    await page.click('[data-testid="accent-color-picker"]');
    await page.fill('[data-testid="color-input"]', '#FF5733');
    
    await page.click('button:has-text("Save")');
    
    // Verify accent color applied
    const accentButton = page.locator('button.btn-primary').first();
    const bgColor = await accentButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be close to #FF5733
    expect(bgColor).toContain('rgb');
  });
});
