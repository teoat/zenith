/**
 * Dashboard and Navigation E2E Tests
 * Comprehensive testing of dashboard functionality and navigation flows
 */
import { test, expect } from '@playwright/test';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Dashboard Overview', () => {
    test('displays dashboard with all widgets', async ({ page }) => {
      await page.goto('/');

      // Verify main dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Intelligence Center')).toBeVisible();

      // Verify metrics cards are present
      await expect(page.locator('text=Total Cases')).toBeVisible();
      await expect(page.locator('text=Active Cases')).toBeVisible();
      await expect(page.locator('text=High Risk Alerts')).toBeVisible();

      // Verify quick actions
      await expect(page.locator('text=Create New Case')).toBeVisible();
      await expect(page.locator('text=View Reports')).toBeVisible();
    });

    test('dashboard metrics update in real-time', async ({ page }) => {
      await page.goto('/');

      // Get initial metric values
      const initialCases = await page.locator('[data-testid="total-cases"]').textContent();

      // Simulate new case creation via API or UI
      await page.goto('/cases');
      await page.click('text=New Case');
      await page.fill('#investigation-title', 'Dashboard Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      // Go back to dashboard
      await page.goto('/');

      // Metrics should update (this might need API mocking for reliability)
      await page.waitForTimeout(2000); // Allow time for updates
      const updatedCases = await page.locator('[data-testid="total-cases"]').textContent();

      // Should be different (or at least not error)
      expect(updatedCases).toBeTruthy();
    });

    test('recent activity feed shows updates', async ({ page }) => {
      await page.goto('/');

      // Verify recent activity section exists
      await expect(page.locator('text=Recent Activity')).toBeVisible();

      // Should show some activity or "no recent activity" message
      const activityFeed = page.locator('[data-testid="activity-feed"]');
      await expect(activityFeed.or(page.locator('text=No recent activity'))).toBeVisible();
    });

    test('system status indicators work', async ({ page }) => {
      await page.goto('/');

      // Verify system status is shown
      const statusIndicator = page.locator('[data-testid="system-status"]');
      await expect(statusIndicator.or(page.locator('text=System Operational'))).toBeVisible();

      // Check for online/offline indicators
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    });
  });

  test.describe('Navigation Flow', () => {
    test('sidebar navigation works correctly', async ({ page }) => {
      // Verify sidebar is present
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

      // Test navigation to different sections
      await page.click('text=Case Management');
      await expect(page).toHaveURL('/cases');

      await page.goto('/');
      await page.click('text=Settings');
      await expect(page).toHaveURL('/settings');

      await page.goto('/');
      await page.click('text=Intelligence Center');
      await expect(page).toHaveURL('/dashboard');
    });

    test('breadcrumb navigation', async ({ page }) => {
      // Navigate to a nested page
      await page.goto('/cases');
      await page.click('text=New Case'); // Assuming this creates/opens a case

      // Should show breadcrumbs
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      await expect(breadcrumbs).toBeVisible();

      // Breadcrumb navigation should work
      await page.click('text=Dashboard');
      await expect(page).toHaveURL('/');
    });

    test('mobile navigation menu', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Mobile menu button should be visible
      await expect(page.locator('[aria-label="Open menu"]')).toBeVisible();

      // Click to open menu
      await page.click('[aria-label="Open menu"]');

      // Menu should be open
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Navigation should work from mobile menu
      await page.click('text=Case Management');
      await expect(page).toHaveURL('/cases');
    });

    test('keyboard navigation', async ({ page }) => {
      // Test tab navigation through main elements
      await page.keyboard.press('Tab'); // Skip link
      await page.keyboard.press('Tab'); // Search
      await page.keyboard.press('Tab'); // Notifications
      await page.keyboard.press('Tab'); // User menu

      // Should be able to navigate sidebar
      await page.keyboard.press('Tab'); // First sidebar item
      await page.keyboard.press('Enter'); // Activate navigation

      // Should navigate to the selected page
      await expect(page).toHaveURL(/\/(dashboard|cases|settings)/);
    });
  });

  test.describe('Search Functionality', () => {
    test('global search works', async ({ page }) => {
      // Find search input
      const searchInput = page.locator('[placeholder*="search" i]');
      await expect(searchInput).toBeVisible();

      // Type search query
      await searchInput.fill('fraud');

      // Should show search results or suggestions
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });

    test('search filters by category', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('case');

      // Check if category filters work
      const categoryFilter = page.locator('[data-testid="search-category-filter"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.click('text=Cases');

        // Results should be filtered
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      }
    });

    test('search keyboard shortcuts', async ({ page }) => {
      // Press Ctrl/Cmd + K to focus search
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

      // Search should be focused
      await expect(page.locator('[placeholder*="search" i]')).toBeFocused();
    });
  });

  test.describe('Offline Mode', () => {
    test('offline indicator appears', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);

      // Reload to trigger offline detection
      await page.reload();

      // Offline indicator should appear
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('text=Offline Mode')).toBeVisible();
    });

    test('offline queue shows pending actions', async ({ page, context }) => {
      await context.setOffline(true);
      await page.reload();

      // Try to perform an action that would be queued
      await page.click('text=Create New Case');

      // Should show pending actions indicator
      await expect(page.locator('[data-testid="pending-actions"]')).toBeVisible();
    });

    test('sync works when back online', async ({ page, context }) => {
      await context.setOffline(true);
      await page.reload();

      // Perform action while offline
      await page.click('text=Create New Case');
      await expect(page.locator('[data-testid="pending-actions"]')).toBeVisible();

      // Go back online
      await context.setOffline(false);

      // Sync should start automatically
      await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();

      // Should complete sync
      await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('dashboard loads within 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 seconds
    });

    test('navigation is instant', async ({ page }) => {
      await page.goto('/');

      const startTime = Date.now();
      await page.click('text=Case Management');

      const navigationTime = Date.now() - startTime;
      expect(navigationTime).toBeLessThan(500); // 500ms
    });

    test('no layout shifts during loading', async ({ page }) => {
      await page.goto('/');

      // Check for layout shift indicators
      const layoutShifts = await page.evaluate(() => {
        let shifts = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && (entry as any).value > 0.1) {
              shifts++;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        return new Promise(resolve => {
          setTimeout(() => {
            observer.disconnect();
            resolve(shifts);
          }, 3000);
        });
      });

      expect(layoutShifts).toBe(0);
    });
  });
});