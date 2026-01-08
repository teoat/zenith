/**
 * E2E tests for critical fraud investigation workflows
 * Tests complete user journeys from case creation to resolution
 */
import { test, expect } from '@playwright/test';

test.describe('Critical Fraud Investigation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as analyst
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Complete case creation and evidence upload workflow', async ({ page }) => {
    // Step 1: Create new case
    await page.click('text=New Case');
    await page.fill('[name="title"]', 'Structuring Investigation E2E');
    await page.selectOption('[name="priority"]', 'high');
    await page.selectOption('[name="caseType"]', 'structuring');
    await page.fill('[name="description"]', 'Multiple transactions just below reporting threshold');
    await page.click('button:has-text("Create Case")');
    
    // Verify case created
    await expect(page.locator('text=Case created successfully')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Structuring Investigation E2E');
    
    // Step 2: Add transactions
    await page.click('text=Add Transaction');
    await page.fill('[name="amount"]', '9999');
    await page.fill('[name="merchant"]', 'ABC Store');
    await page.fill('[name="date"]', '2025-12-01');
    await page.click('button:has-text("Save Transaction")');
    
    await page.click('text=Add Transaction');
    await page.fill('[name="amount"]', '9998');
    await page.fill('[name="merchant"]', 'XYZ Store');
    await page.fill('[name="date"]', '2025-12-02');
    await page.click('button:has-text("Save Transaction")');
    
    // Step 3: Upload evidence
    await page.click('text=Upload Evidence');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/bank-statement.pdf');
    await page.waitForSelector('text=Upload complete', { timeout: 10000 });
    
    // Verify evidence appears
    await expect(page.locator('text=bank-statement.pdf')).toBeVisible();
    
    // Step 4: Run fraud analysis
    await page.click('button:has-text("Analyze")');
    await page.waitForSelector('.fraud-score', { timeout: 15000 });
    
    // Verify fraud detection results
    const riskScore = await page.locator('.fraud-score').textContent();
    expect(parseFloat(riskScore)).toBeGreaterThan(0);
    
    // Verify structuring alert appears
    await expect(page.locator('text=Structuring Pattern Detected')).toBeVisible();
    
    // Step 5: Update case status
    await page.selectOption('[name="status"]', 'escalated');
    await page.click('button:has-text("Update Status")');
    await expect(page.locator('.status-badge')).toContainText('Escalated');
    
    // Step 6: Add investigation note
    await page.click('text=Add Note');
    await page.fill('[name="noteContent"]', 'Confirmed structuring pattern. Escalating to compliance team.');
    await page.click('button:has-text("Save Note")');
    
    // Verify note appears
    await expect(page.locator('text=Confirmed structuring pattern')).toBeVisible();
  });

  test('Real-time collaboration workflow', async ({ page, context }) => {
    // Create a case as first analyst
    await page.click('text=New Case');
    await page.fill('[name="title"]', 'Collaboration Test Case');
    await page.click('button:has-text("Create Case")');
    
    const caseUrl = page.url();
    
    // Open second browser tab as another analyst
    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.fill('[name="email"]', 'analyst2@378x492.com');
    await page2.fill('[name="password"]', 'Test123!');
    await page2.click('button[type="submit"]');
    await page2.goto(caseUrl);
    
    // Add note in first tab
    await page.click('text=Add Note');
    await page.fill('[name="noteContent"]', 'Initial investigation started');
    await page.click('button:has-text("Save Note")');
    
    // Verify note appears in real-time in second tab
    await expect(page2.locator('text=Initial investigation started')).toBeVisible({ timeout: 5000 });
    
    // Verify presence indicator
    await expect(page.locator('.user-presence')).toContainText('2 analysts viewing');
  });

  test('Offline mode and sync workflow', async ({ page, context }) => {
    // Create case while online
    await page.click('text=New Case');
    await page.fill('[name="title"]', 'Offline Test Case');
    await page.click('button:has-text("Create Case")');
    
    // Go offline
    await context.setOffline(true);
    await expect(page.locator('.offline-indicator')).toBeVisible();
    
    // Add transaction while offline
    await page.click('text=Add Transaction');
    await page.fill('[name="amount"]', '5000');
    await page.click('button:has-text("Save Transaction")');
    
    // Verify queued indicator
    await expect(page.locator('.sync-pending')).toContainText('1 action pending');
    
    // Go back online
    await context.setOffline(false);
    
    // Wait for sync
    await expect(page.locator('.sync-complete')).toBeVisible({ timeout: 10000 });
    
    // Verify transaction synced
    await page.reload();
    await expect(page.locator('text=$5000')).toBeVisible();
  });

  test('Accessibility - Keyboard navigation', async ({ page }) => {
    // Navigate to cases page
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Navigation
    await page.keyboard.press('Enter'); // Navigate to Cases
    
    // Create case with keyboard only
    await page.keyboard.press('Tab'); // New Case button
    await page.keyboard.press('Enter');
    
    // Focus should be on title field
    await page.keyboard.type('Keyboard Navigation Test');
    await page.keyboard.press('Tab'); // Move to priority
    await page.keyboard.press('ArrowDown'); // Select high priority
    await page.keyboard.press('Tab'); // Move to create button
    await page.keyboard.press('Enter');
    
    // Verify case created
    await expect(page.locator('h1')).toContainText('Keyboard Navigation Test');
  });
});

test.describe('Performance Tests', () => {
  test('Large dataset rendering', async ({ page }) => {
    await page.goto('/cases');
    
    // Load page with 100+ cases
    const startTime = Date.now();
    await page.waitForSelector('.case-row', { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    
    // Should load in less than 2 seconds
    expect(loadTime).toBeLessThan(2000);
    
    // Scroll performance (virtualization)
    await page.evaluate(() => {
      window.scrollBy(0, 5000);
    });
    
    // Verify virtual list is rendering
    const visibleRows = await page.locator('.case-row').count();
    expect(visibleRows).toBeLessThanOrEqual(50); // Only visible rows rendered
  });

  test('Search performance', async ({ page }) => {
    await page.goto('/cases');
    
    const startTime = Date.now();
    await page.fill('[name="search"]', 'fraud');
    await page.waitForSelector('.search-results', { timeout: 1000 });
    const searchTime = Date.now() - startTime;
    
    // Search should complete in less than 500ms
    expect(searchTime).toBeLessThan(500);
  });
});
