
import { test, expect } from '@playwright/test';

test.describe('Zenith Platform Features', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass authentication
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNmMjlkMy01MDc1LTRkM2MtYjc1NC1kZjVlMjAzNTZlYzUiLCJ1c2VybmFtZSI6InRlc3RhbmFseXN0Iiwicm9sZSI6ImFuYWx5c3QiLCJtZmFfdmVyaWZpZWQiOmZhbHNlLCJleHAiOjE3NjYxMDQzNzksImlhdCI6MTc2NjEwMjU3OSwiaXNzIjoiMzc4eDQ5MiIsInR5cGUiOiJhY2Nlc3MiLCJqdGkiOiJVTTN2T2k4N1lNa04yUnVmd1g1SlhRIn0.McbG_XATyDKOF9GXPyp9Ge7CB2ICNfard3Raud6ic5k';
    await page.addInitScript((token) => {
      localStorage.setItem('token', token);
    }, token);
    await page.goto('/');
  });

  test('AI Assistant should open and respond', async ({ page }) => {
    // Use the newly added data-testid
    await page.click('[data-testid="ai-assistant-trigger"]');
    await expect(page.locator('[data-testid="ai-assistant-window"]')).toBeVisible();
    
    await page.fill('[data-testid="ai-assistant-input"]', 'Hello Frenly!');
    await page.click('[data-testid="ai-assistant-send"]');
    
    // Check if user message appears
    await expect(page.getByText('Hello Frenly!')).toBeVisible();
    
    // Wait for AI response (might take a second due to simulated thinking)
    await expect(page.locator('[data-testid="ai-assistant-window"]')).toContainText('investigate today', { timeout: 10000 });
  });

  test('Compliance Monitoring should display data', async ({ page }) => {
    await page.goto('/compliance/monitoring');
    await expect(page.locator('h1')).toContainText('Compliance Monitoring');
    
    // Check for essential cards
    await expect(page.getByText('System Health Overview')).toBeVisible();
    await expect(page.getByText('Active Alerts')).toBeVisible();
    await expect(page.getByText('Performance Metrics')).toBeVisible();
  });

  test('System Diagnostics should run health checks', async ({ page }) => {
    await page.goto('/diagnostics/system');
    await expect(page.locator('h1')).toContainText('System Diagnostics');
    
    // Look for Run Diagnostics button
    const runButton = page.getByRole('button', { name: /run/i });
    if (await runButton.isVisible()) {
        await runButton.click();
        await expect(page.getByText(/complete/i)).toBeVisible({ timeout: 15000 });
    }
  });

  test('SAR Creation should load wizard steps', async ({ page }) => {
    await page.goto('/compliance/sar/create');
    await expect(page.locator('h1')).toContainText('SAR');
    
    // Check for wizard steps
    await expect(page.getByText(/subject/i)).toBeVisible();
    await expect(page.getByText(/activity/i)).toBeVisible();
  });
});
