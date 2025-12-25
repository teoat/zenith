/**
 * Comprehensive E2E Authentication Flow Tests
 * Covers login, logout, session management, and security features
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Login Scenarios', () => {
    test('successful login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill login form
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      // Verify redirect to dashboard
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Verify session persistence
      await page.reload();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('login with invalid credentials shows error', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[name="email"]', 'invalid@378x492.com');
      await page.fill('[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Verify error message appears
      await expect(page.locator('text=Login failed')).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('login with empty fields shows validation', async ({ page }) => {
      await page.goto('/login');

      await page.click('button[type="submit"]');

      // Verify validation messages
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('login form prevents brute force attacks', async ({ page }) => {
      await page.goto('/login');

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'wrong');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
      }

      // Should show rate limiting message
      await expect(page.locator('text=Too many login attempts')).toBeVisible();
    });

    test('password field toggles visibility', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('[name="password"]');
      const toggleButton = page.locator('[aria-label*="password"]');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.click();

      // Password should be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle again
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Session Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');
    });

    test('session persists across page reloads', async ({ page }) => {
      await page.reload();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('session expires after timeout', async ({ page }) => {
      // Mock session timeout by clearing localStorage
      await page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.setItem('sessionExpiry', Date.now() - 1000);
      });

      await page.reload();

      // Should redirect to login
      await expect(page).toHaveURL('/login');
      await expect(page.locator('text=Session expired')).toBeVisible();
    });

    test('logout clears session', async ({ page }) => {
      // Click logout button (assuming it exists in header)
      await page.click('[aria-label="Logout"]');

      // Verify redirect to login
      await expect(page).toHaveURL('/login');

      // Verify session is cleared
      await page.reload();
      await expect(page).toHaveURL('/login');
    });

    test('multiple tabs share session', async ({ page, context }) => {
      // Open second tab
      const page2 = await context.newPage();
      await page2.goto('/');

      // Both tabs should show dashboard
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page2.locator('text=Dashboard')).toBeVisible();

      // Logout from first tab
      await page.click('[aria-label="Logout"]');

      // Second tab should also be logged out
      await page2.reload();
      await expect(page2).toHaveURL('/login');
    });
  });

  test.describe('Security Features', () => {
    test('login page prevents access when authenticated', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Try to access login page again
      await page.goto('/login');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/');
    });

    test('protected routes redirect to login', async ({ page }) => {
      await page.goto('/cases');
      await expect(page).toHaveURL('/login');

      await page.goto('/settings');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Multi-language Support', () => {
    test('language switcher changes interface language', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // Switch to Indonesian
      await page.click('[aria-label="Select your preferred language"]');
      await page.click('text=Bahasa Indonesia');

      // Verify language change
      await expect(page.locator('text=Dasbor')).toBeVisible();
      await expect(page.locator('text=Kasus')).toBeVisible();

      // Language preference persists
      await page.reload();
      await expect(page.locator('text=Dasbor')).toBeVisible();
    });

    test('login form shows in selected language', async ({ page }) => {
      // Set language preference in localStorage
      await page.evaluate(() => {
        localStorage.setItem('accessibility-language', 'id');
      });

      await page.goto('/login');

      // Login form should show in Indonesian
      await expect(page.locator('text=Masuk')).toBeVisible();
    });
  });
});