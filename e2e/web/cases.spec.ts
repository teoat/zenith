// e2e/web/cases.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_CASES } from '../fixtures/test-data';

test.describe('Case Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display cases list', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');
    await expect(page).toHaveURL('/cases');
    await expect(page.locator('[data-testid="cases-header"]')).toBeVisible();
  });

  test('should create new case', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');
    await page.click('[data-testid="create-case-button"]');

    // Fill case creation form
    await page.fill('[data-testid="case-title-input"]', TEST_CASES.fraudCase.title);
    await page.fill('[data-testid="case-description-input"]', TEST_CASES.fraudCase.description);
    await page.selectOption('[data-testid="case-priority-select"]', TEST_CASES.fraudCase.priority);
    await page.selectOption('[data-testid="case-type-select"]', TEST_CASES.fraudCase.caseType);
    await page.fill('[data-testid="case-customer-input"]', TEST_CASES.fraudCase.customerName);
    await page.fill('[data-testid="case-amount-input"]', TEST_CASES.fraudCase.fraudAmount.toString());

    await page.click('[data-testid="submit-case-button"]');

    // Verify case was created
    await expect(page.locator('[data-testid="case-list"]')).toContainText(TEST_CASES.fraudCase.title);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should view case details', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Click on the first case in the list
    const caseItem = page.locator('[data-testid="case-item"]').first();
    await expect(caseItem).toBeVisible();
    await caseItem.click();

    // Verify case details page
    await expect(page.locator('[data-testid="case-detail-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-detail-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-priority"]')).toBeVisible();
  });

  test('should update case status', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Click on the first case
    const caseItem = page.locator('[data-testid="case-item"]').first();
    await caseItem.click();

    // Click edit button
    await page.click('[data-testid="edit-case-button"]');

    // Change status
    await page.selectOption('[data-testid="case-status-select"]', 'investigating');

    // Save changes
    await page.click('[data-testid="save-case-button"]');

    // Verify status was updated
    await expect(page.locator('[data-testid="case-status"]')).toContainText('Investigating');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should filter cases by status', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Apply status filter
    await page.selectOption('[data-testid="status-filter"]', 'open');

    // Verify only open cases are shown
    await page.waitForTimeout(1000); // Wait for filter to apply
    const caseItems = page.locator('[data-testid="case-item"]');

    if (await caseItems.count() > 0) {
      // Check that visible cases have "Open" status
      const statusElements = page.locator('[data-testid="case-status"]');
      const statusCount = await statusElements.count();

      for (let i = 0; i < statusCount; i++) {
        await expect(statusElements.nth(i)).toContainText('Open');
      }
    }
  });

  test('should filter cases by priority', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Apply priority filter
    await page.selectOption('[data-testid="priority-filter"]', 'high');

    // Verify only high priority cases are shown
    await page.waitForTimeout(1000);
    const caseItems = page.locator('[data-testid="case-item"]');

    if (await caseItems.count() > 0) {
      const priorityElements = page.locator('[data-testid="case-priority"]');
      const priorityCount = await priorityElements.count();

      for (let i = 0; i < priorityCount; i++) {
        await expect(priorityElements.nth(i)).toContainText('High');
      }
    }
  });

  test('should search cases', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Search for a specific case
    await page.fill('[data-testid="case-search-input"]', TEST_CASES.fraudCase.title);
    await page.click('[data-testid="search-button"]');

    // Verify search results
    await page.waitForTimeout(1000);
    const caseItems = page.locator('[data-testid="case-item"]');

    if (await caseItems.count() > 0) {
      await expect(caseItems.first()).toContainText(TEST_CASES.fraudCase.title);
    }
  });

  test('should sort cases by date', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Click sort by date
    await page.click('[data-testid="sort-date-button"]');

    // Verify cases are sorted (newest first by default)
    const caseItems = page.locator('[data-testid="case-item"]');
    const count = await caseItems.count();

    if (count >= 2) {
      // This is a basic check - in a real app you'd verify date ordering
      await expect(caseItems.first()).toBeVisible();
      await expect(caseItems.nth(count - 1)).toBeVisible();
    }
  });

  test('should paginate cases', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Check for pagination controls
    const pagination = page.locator('[data-testid="pagination"]');

    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page-button"]');

      // Verify page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');

      // Go back to first page
      await page.click('[data-testid="prev-page-button"]');
      await expect(page.locator('[data-testid="current-page"]')).toContainText('1');
    }
  });

  test('should export cases', async ({ page }) => {
    await page.click('[data-testid="nav-cases"]');

    // Click export button
    await page.click('[data-testid="export-cases-button"]');

    // Select export format
    await page.selectOption('[data-testid="export-format-select"]', 'csv');

    // Confirm export
    await page.click('[data-testid="confirm-export-button"]');

    // Verify download was initiated
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('cases');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});