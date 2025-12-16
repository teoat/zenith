import { test, expect } from '@playwright/test';

test.describe('UI/UX Enhancements Verification', () => {

  // Mock API responses
  test.beforeEach(async ({ page }) => {
    // Mock Dashboard Metrics
    await page.route('**/api/v1/stats/metrics', async route => {
      await route.fulfill({
        json: {
          total_volume: 1500000,
          active_alerts: 45,
          risk_score_avg: 75,
          cases_resolved: 12
        }
      });
    });

    // Mock Graph Data
    await page.route('**/api/v1/relationship-graph', async route => {
      await route.fulfill({
        json: {
          nodes: [
            { id: '1', type: 'person', name: 'John Doe', properties: { val: 10 } },
            { id: '2', type: 'company', name: 'Shell Corp', properties: { val: 20 } }
          ],
          links: [
            { source: '1', target: '2', type: 'director_of' }
          ]
        }
      });
    });

    // Mock Entity Search
    await page.route('**/api/v1/relationship-graph/search*', async route => {
      await route.fulfill({
        json: {
          nodes: [
             { id: '99', type: 'account', name: 'Suspicious Account', properties: { val: 15 } }
          ],
          links: []
        }
      });
    });

    // Navigate to app (assuming login is bypassed or default state)
    // For this test, we might need to simulate login if protected
    // reusing login logic from critical-workflows usually
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
  });

  test('Dashboard loads metrics from server-side', async ({ page }) => {
    await page.goto('/dashboard');
    // Check if mocked value appears
    await expect(page.locator('text=$1,500,000')).toBeVisible(); 
  });

  test('Investigation resets without full reload', async ({ page }) => {
    await page.goto('/investigation');
    
    // Set a window property to check for persistence
    await page.evaluate(() => window.foo = 'bar');
    
    // Wait for graph to load
    await expect(page.locator('text=Shell Corp')).toBeVisible();

    // Click Reset
    await page.click('button[title="Reset Layout"]'); // Assuming generic title or aria-label, might need adjustment
    
    // Check if property still exists
    const preserved = await page.evaluate(() => window.foo);
    expect(preserved).toBe('bar'); // If page reloaded, this would be undefined
  });

  test('Entity Registry Search works', async ({ page }) => {
    await page.goto('/investigation');
    
    // Type in search box
    await page.fill('input[placeholder="Search entities..."]', 'Suspicious');
    
    // Expect loading state (might be too fast to catch, but we can try)
    // await expect(page.locator('text=Searching database...')).toBeVisible();

    // Expect result
    await expect(page.locator('text=Suspicious Account')).toBeVisible();
  });
});
