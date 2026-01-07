import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a user to login and see the dashboard', async ({ page }) => {
    // 1. Navigate to Login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Zenith/);

    // 2. Fill Credentials (Mock credentials for dev environment)
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123'); // Assuming these are dev defaults

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verification
    // Expect to be redirected to dashboard or see dashboard element
    await expect(page.locator('text=Evidence Locker')).toBeVisible({ timeout: 10000 });
    
    // 5. Check Project Selection if applicable
    // await expect(page.locator('text=Forensic Workspace Selection')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'badpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid username or password')).toBeVisible();
  });
});
