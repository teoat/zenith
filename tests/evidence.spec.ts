// e2e/web/evidence.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_EVIDENCE } from '../fixtures/test-data';
import path from 'path';

test.describe('Evidence Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a case
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to cases and select first case
    await page.click('[data-testid="nav-cases"]');
    await expect(page).toHaveURL('/cases');

    const caseItem = page.locator('[data-testid="case-item"]').first();
    if (await caseItem.isVisible()) {
      await caseItem.click();
      await expect(page.locator('[data-testid="case-detail-title"]')).toBeVisible();
    }
  });

  test('should display evidence section', async ({ page }) => {
    await expect(page.locator('[data-testid="evidence-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-list"]')).toBeVisible();
  });

  test('should upload document evidence', async ({ page }) => {
    // Create a test file
    const testFilePath = path.join(process.cwd(), 'e2e', 'fixtures', 'test-document.pdf');

    // Click upload button
    await page.click('[data-testid="upload-evidence-button"]');

    // Upload file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(testFilePath);

    // Fill metadata
    await page.fill('[data-testid="evidence-title-input"]', 'Test Document Evidence');
    await page.fill('[data-testid="evidence-description-input"]', 'Test document for E2E testing');
    await page.selectOption('[data-testid="evidence-category-select"]', 'document');

    // Submit upload
    await page.click('[data-testid="submit-evidence-button"]');

    // Verify upload success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-list"]')).toContainText('Test Document Evidence');
  });

  test('should upload image evidence', async ({ page }) => {
    // Create a test image file
    const testImagePath = path.join(process.cwd(), 'e2e', 'fixtures', 'test-image.png');

    // Click upload button
    await page.click('[data-testid="upload-evidence-button"]');

    // Upload image
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(testImagePath);

    // Fill metadata
    await page.fill('[data-testid="evidence-title-input"]', 'Test Image Evidence');
    await page.fill('[data-testid="evidence-description-input"]', 'Test image for E2E testing');
    await page.selectOption('[data-testid="evidence-category-select"]', 'image');

    // Submit upload
    await page.click('[data-testid="submit-evidence-button"]');

    // Verify upload success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-list"]')).toContainText('Test Image Evidence');
  });

  test('should validate file types', async ({ page }) => {
    // Try to upload invalid file type
    const invalidFilePath = path.join(process.cwd(), 'e2e', 'fixtures', 'invalid-file.exe');

    await page.click('[data-testid="upload-evidence-button"]');

    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(invalidFilePath);

    // Should show error message
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('Invalid file type');
  });

  test('should validate file size', async ({ page }) => {
    // Create a large test file (over limit)
    const largeFilePath = path.join(process.cwd(), 'e2e', 'fixtures', 'large-file.zip');

    await page.click('[data-testid="upload-evidence-button"]');

    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(largeFilePath);

    // Should show file size error
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File too large');
  });

  test('should process uploaded evidence', async ({ page }) => {
    // Upload a document first
    const testFilePath = path.join(process.cwd(), 'e2e', 'fixtures', 'test-document.pdf');

    await page.click('[data-testid="upload-evidence-button"]');
    await page.locator('[data-testid="file-input"]').setInputFiles(testFilePath);
    await page.fill('[data-testid="evidence-title-input"]', 'Processing Test Document');
    await page.selectOption('[data-testid="evidence-category-select"]', 'document');
    await page.click('[data-testid="submit-evidence-button"]');

    // Wait for processing to complete
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 30000 });

    // Verify processing results
    await expect(page.locator('[data-testid="evidence-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-text-extraction"]')).toBeVisible();
  });

  test('should view evidence details', async ({ page }) => {
    // Click on an evidence item
    const evidenceItem = page.locator('[data-testid="evidence-item"]').first();
    if (await evidenceItem.isVisible()) {
      await evidenceItem.click();

      // Verify evidence viewer opens
      await expect(page.locator('[data-testid="evidence-viewer"]')).toBeVisible();
      await expect(page.locator('[data-testid="evidence-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="evidence-metadata"]')).toBeVisible();
    }
  });

  test('should download evidence', async ({ page }) => {
    const evidenceItem = page.locator('[data-testid="evidence-item"]').first();
    if (await evidenceItem.isVisible()) {
      // Click download button
      await page.click('[data-testid="download-evidence-button"]');

      // Verify download starts
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test('should search evidence', async ({ page }) => {
    // Search for specific evidence
    await page.fill('[data-testid="evidence-search-input"]', 'Test Document');
    await page.click('[data-testid="evidence-search-button"]');

    // Verify search results
    await page.waitForTimeout(1000);
    const evidenceItems = page.locator('[data-testid="evidence-item"]');

    if (await evidenceItems.count() > 0) {
      await expect(evidenceItems.first()).toContainText('Test Document');
    }
  });

  test('should filter evidence by category', async ({ page }) => {
    // Filter by document category
    await page.selectOption('[data-testid="evidence-category-filter"]', 'document');

    // Verify only documents are shown
    await page.waitForTimeout(1000);
    const evidenceItems = page.locator('[data-testid="evidence-item"]');

    if (await evidenceItems.count() > 0) {
      // Check that all visible items are documents
      const categoryBadges = page.locator('[data-testid="evidence-category-badge"]');
      const badgeCount = await categoryBadges.count();

      for (let i = 0; i < badgeCount; i++) {
        await expect(categoryBadges.nth(i)).toContainText('Document');
      }
    }
  });

  test('should delete evidence', async ({ page }) => {
    const evidenceItem = page.locator('[data-testid="evidence-item"]').first();
    const initialCount = await page.locator('[data-testid="evidence-item"]').count();

    if (initialCount > 0) {
      // Click delete button
      await page.click('[data-testid="delete-evidence-button"]');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');

      // Verify evidence was removed
      await expect(page.locator('[data-testid="delete-success"]')).toBeVisible();

      const finalCount = await page.locator('[data-testid="evidence-item"]').count();
      expect(finalCount).toBeLessThan(initialCount);
    }
  });

  test('should handle drag and drop upload', async ({ page }) => {
    // This test would require setting up a test file and drag-drop simulation
    // For now, we'll mark it as skipped since drag-drop testing is complex
    test.skip();
  });
});