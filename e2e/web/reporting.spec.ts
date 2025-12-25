// e2e/web/reporting.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Reporting and Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to reporting
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    await page.click('[data-testid="nav-reporting"]');
    await expect(page).toHaveURL('/reporting');
  });

  test('should display reporting dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="reporting-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-tabs"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-range-picker"]')).toBeVisible();
  });

  test('should display case analytics', async ({ page }) => {
    // Switch to case analytics tab
    await page.click('[data-testid="case-analytics-tab"]');

    // Verify case analytics content
    await expect(page.locator('[data-testid="case-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-trends-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-status-breakdown"]')).toBeVisible();
  });

  test('should display transaction analytics', async ({ page }) => {
    // Switch to transaction analytics tab
    await page.click('[data-testid="transaction-analytics-tab"]');

    // Verify transaction analytics content
    await expect(page.locator('[data-testid="transaction-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-volume-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="fraud-amount-chart"]')).toBeVisible();
  });

  test('should filter analytics by date range', async ({ page }) => {
    // Set date range
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-12-31');

    // Apply filter
    await page.click('[data-testid="apply-date-filter"]');

    // Verify data is filtered (this would show updated metrics)
    await expect(page.locator('[data-testid="filtered-data-indicator"]')).toBeVisible();
  });

  test('should export analytics report', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-analytics-button"]');

    // Select export format
    await page.selectOption('[data-testid="export-format-select"]', 'pdf');

    // Select report type
    await page.selectOption('[data-testid="report-type-select"]', 'comprehensive');

    // Confirm export
    await page.click('[data-testid="confirm-export-button"]');

    // Verify download
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('analytics-report');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should display risk heatmaps', async ({ page }) => {
    // Switch to risk analysis tab
    await page.click('[data-testid="risk-analysis-tab"]');

    // Verify risk heatmap is displayed
    await expect(page.locator('[data-testid="risk-heatmap"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-legend"]')).toBeVisible();
  });

  test('should interact with risk heatmap', async ({ page }) => {
    await page.click('[data-testid="risk-analysis-tab"]');

    // Click on a heatmap cell
    await page.locator('[data-testid="heatmap-cell"]').first().click();

    // Verify details panel opens
    await expect(page.locator('[data-testid="risk-details-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-score-display"]')).toBeVisible();
  });

  test('should display performance metrics', async ({ page }) => {
    // Switch to performance tab
    await page.click('[data-testid="performance-tab"]');

    // Verify performance metrics
    await expect(page.locator('[data-testid="response-time-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="throughput-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible();
  });

  test('should create custom report', async ({ page }) => {
    // Click create custom report button
    await page.click('[data-testid="create-custom-report-button"]');

    // Fill report configuration
    await page.fill('[data-testid="report-title-input"]', 'Custom Fraud Analysis');
    await page.fill('[data-testid="report-description-input"]', 'Custom analysis for Q4');

    // Select metrics to include
    await page.check('[data-testid="include-case-metrics"]');
    await page.check('[data-testid="include-transaction-metrics"]');
    await page.check('[data-testid="include-risk-analysis"]');

    // Set date range
    await page.fill('[data-testid="report-start-date"]', '2024-10-01');
    await page.fill('[data-testid="report-end-date"]', '2024-12-31');

    // Save report configuration
    await page.click('[data-testid="save-report-config"]');

    // Verify report was created
    await expect(page.locator('[data-testid="custom-reports-list"]')).toContainText('Custom Fraud Analysis');
  });

  test('should schedule automated reports', async ({ page }) => {
    // Navigate to scheduled reports
    await page.click('[data-testid="scheduled-reports-tab"]');

    // Click create schedule button
    await page.click('[data-testid="create-schedule-button"]');

    // Configure schedule
    await page.selectOption('[data-testid="schedule-frequency"]', 'weekly');
    await page.selectOption('[data-testid="schedule-day"]', 'monday');
    await page.fill('[data-testid="schedule-email"]', 'analyst@company.com');

    // Select report template
    await page.selectOption('[data-testid="schedule-template"]', 'weekly-summary');

    // Save schedule
    await page.click('[data-testid="save-schedule-button"]');

    // Verify schedule was created
    await expect(page.locator('[data-testid="scheduled-reports-list"]')).toContainText('Weekly Summary');
  });

  test('should display real-time metrics', async ({ page }) => {
    // Check initial metrics
    const initialCases = await page.locator('[data-testid="total-cases-metric"]').textContent();

    // Wait for potential updates (in a real app, this would update automatically)
    await page.waitForTimeout(5000);

    // Metrics should be displayed (may or may not change during test)
    await expect(page.locator('[data-testid="total-cases-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-cases-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="resolved-cases-metric"]')).toBeVisible();
  });

  test('should handle report sharing', async ({ page }) => {
    // Click share button on a report
    await page.locator('[data-testid="share-report-button"]').first().click();

    // Verify share dialog opens
    await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible();

    // Enter recipient email
    await page.fill('[data-testid="share-email-input"]', 'colleague@company.com');

    // Add message
    await page.fill('[data-testid="share-message-input"]', 'Please review this fraud analysis report');

    // Send share
    await page.click('[data-testid="send-share-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="share-success"]')).toBeVisible();
  });

  test('should display audit trails', async ({ page }) => {
    // Switch to audit tab
    await page.click('[data-testid="audit-tab"]');

    // Verify audit log is displayed
    await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-entries"]')).toBeVisible();
  });

  test('should filter audit entries', async ({ page }) => {
    await page.click('[data-testid="audit-tab"]');

    // Apply user filter
    await page.selectOption('[data-testid="audit-user-filter"]', TEST_USERS.analyst.username);

    // Apply action filter
    await page.selectOption('[data-testid="audit-action-filter"]', 'case_created');

    // Apply date filter
    await page.fill('[data-testid="audit-start-date"]', '2024-01-01');
    await page.fill('[data-testid="audit-end-date"]', '2024-12-31');

    // Apply filters
    await page.click('[data-testid="apply-audit-filters"]');

    // Verify filtered results
    await page.waitForTimeout(1000);
    const auditEntries = page.locator('[data-testid="audit-entry"]');

    if (await auditEntries.count() > 0) {
      // All visible entries should match filters
      await expect(auditEntries.first()).toContainText(TEST_USERS.analyst.username);
    }
  });
});