import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Use test credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Find and click logout button
    await page.click('button:has-text("Logout")');
    
    // Should return to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:5173/cases');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
