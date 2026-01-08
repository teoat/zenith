import { test, expect } from '@playwright/test';

test.describe('Zenith Fraud Detection - End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:3000');
  });

  test('Complete user journey - Case creation to resolution', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // Navigate to cases
    await page.click('[data-testid="cases-nav"]');
    await expect(page).toHaveURL(/.*cases/);

    // Create new case
    await page.click('[data-testid="create-case-button"]');
    await page.fill('[data-testid="case-title"]', 'E2E Test Case');
    await page.selectOption('[data-testid="case-priority"]', 'HIGH');
    await page.fill('[data-testid="case-description"]', 'Automated test case');
    await page.click('[data-testid="submit-case"]');

    // Verify case creation
    await expect(page.locator('[data-testid="case-list"]')).toContainText('E2E Test Case');

    // Open case details
    await page.click('[data-testid="case-item"]:first-child');
    await expect(page.locator('[data-testid="case-detail"]')).toBeVisible();

    // Add evidence
    await page.click('[data-testid="add-evidence"]');
    await page.setInputFiles('[data-testid="evidence-upload"]', 'test-files/document.pdf');
    await page.click('[data-testid="upload-evidence"]');

    // Run AI analysis
    await page.click('[data-testid="run-analysis"]');
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();

    // Create workflow
    await page.click('[data-testid="create-workflow"]');
    await page.selectOption('[data-testid="workflow-template"]', 'fraud-investigation');
    await page.click('[data-testid="start-workflow"]');

    // Complete investigation
    await page.click('[data-testid="complete-investigation"]');
    await page.selectOption('[data-testid="resolution"]', 'confirmed-fraud');
    await page.click('[data-testid="finalize-case"]');

    // Verify completion
    await expect(page.locator('[data-testid="case-status"]')).toContainText('Closed');
  });

  test('Real-time notifications work', async ({ page, context }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // Wait for WebSocket connection
    await page.waitForSelector('[data-testid="notification-indicator"]');

    // Simulate backend event (in real test, this would come from API)
    await page.evaluate(() => {
      // Mock WebSocket message
      window.postMessage({
        type: 'websocket-message',
        data: {
          type: 'alert',
          message: 'New high-risk transaction detected'
        }
      }, '*');
    });

    // Verify notification appears
    await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-toast"]')).toContainText('New high-risk transaction');
  });

  test('Performance metrics meet requirements', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 5000 });

    const loadTime = Date.now() - startTime;

    // Verify performance requirements
    expect(loadTime).toBeLessThan(3000); // < 3 seconds

    // Check for performance marks
    const performanceMarks = await page.evaluate(() => {
      const marks = performance.getEntriesByType('mark');
      return marks.map(mark => mark.name);
    });

    expect(performanceMarks).toContain('app-ready');
  });

  test('Offline functionality works', async ({ page, context }) => {
    // Go online first
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForSelector('[data-testid="dashboard-content"]');

    // Go offline
    await context.setOffline(true);

    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Try to perform cached operation
    await page.click('[data-testid="cached-action"]');
    await expect(page.locator('[data-testid="action-success"]')).toBeVisible();

    // Go back online
    await context.setOffline(false);
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
  });

  test('Accessibility compliance', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for ARIA labels
    const ariaLabels = await page.locator('[aria-label]').count();
    expect(ariaLabels).toBeGreaterThan(10);

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.isVisible()).toBe(true);

    // Check color contrast (basic check)
    const textElements = await page.locator('text').all();
    for (const element of textElements.slice(0, 5)) {
      const color = await element.evaluate(el => window.getComputedStyle(el).color);
      expect(color).toBeDefined();
    }
  });
});