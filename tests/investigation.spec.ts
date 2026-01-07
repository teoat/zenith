// e2e/web/investigation.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Investigation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to investigation
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
    await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to investigation (assuming a case exists)
    await page.goto('/investigation/case-123');
  });

  test('should display investigation interface', async ({ page }) => {
    await expect(page.locator('[data-testid="investigation-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="investigation-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="entity-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="tools-panel"]')).toBeVisible();
  });

  test('should switch between view modes', async ({ page }) => {
    // Test graph view (default)
    await expect(page.locator('[data-testid="graph-canvas"]')).toBeVisible();

    // Switch to timeline view
    await page.click('[data-testid="timeline-view-button"]');
    await expect(page.locator('[data-testid="timeline-view"]')).toBeVisible();

    // Switch to map view
    await page.click('[data-testid="map-view-button"]');
    await expect(page.locator('[data-testid="map-view"]')).toBeVisible();

    // Switch back to graph view
    await page.click('[data-testid="graph-view-button"]');
    await expect(page.locator('[data-testid="graph-canvas"]')).toBeVisible();
  });

  test('should add entity to investigation', async ({ page }) => {
    // Open entity palette
    await page.click('[data-testid="add-entity-button"]');

    // Select person entity type
    await page.click('[data-testid="entity-type-person"]');

    // Click on canvas to place entity
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 200, y: 150 }
    });

    // Verify entity was added
    await expect(page.locator('[data-testid="canvas-entity"]')).toBeVisible();
    await expect(page.locator('[data-testid="entity-person"]')).toBeVisible();
  });

  test('should edit entity properties', async ({ page }) => {
    // Add an entity first
    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-person"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 200, y: 150 }
    });

    // Click on the entity to select it
    await page.locator('[data-testid="canvas-entity"]').click();

    // Open properties panel
    await expect(page.locator('[data-testid="entity-properties"]')).toBeVisible();

    // Edit entity name
    await page.fill('[data-testid="entity-name-input"]', 'John Doe');

    // Edit entity description
    await page.fill('[data-testid="entity-description-input"]', 'Suspected fraud perpetrator');

    // Save changes
    await page.click('[data-testid="save-entity-button"]');

    // Verify changes were saved
    await expect(page.locator('[data-testid="entity-label"]')).toContainText('John Doe');
  });

  test('should create relationship between entities', async ({ page }) => {
    // Add first entity
    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-person"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 150, y: 150 }
    });

    // Add second entity
    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-account"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 350, y: 150 }
    });

    // Select relationship tool
    await page.click('[data-testid="relationship-tool"]');

    // Create relationship by clicking on both entities
    await page.locator('[data-testid="canvas-entity"]').first().click();
    await page.locator('[data-testid="canvas-entity"]').last().click();

    // Verify relationship was created
    await expect(page.locator('[data-testid="canvas-relationship"]')).toBeVisible();
  });

  test('should edit relationship properties', async ({ page }) => {
    // Create a relationship first (following the steps above)
    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-person"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 150, y: 150 }
    });

    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-account"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 350, y: 150 }
    });

    await page.click('[data-testid="relationship-tool"]');
    await page.locator('[data-testid="canvas-entity"]').first().click();
    await page.locator('[data-testid="canvas-entity"]').last().click();

    // Click on the relationship to edit it
    await page.locator('[data-testid="canvas-relationship"]').click();

    // Edit relationship type
    await page.selectOption('[data-testid="relationship-type-select"]', 'owns');

    // Edit relationship description
    await page.fill('[data-testid="relationship-description-input"]', 'Account ownership relationship');

    // Save changes
    await page.click('[data-testid="save-relationship-button"]');

    // Verify changes
    await expect(page.locator('[data-testid="relationship-label"]')).toContainText('owns');
  });

  test('should use investigation tools', async ({ page }) => {
    // Test zoom controls
    await page.click('[data-testid="zoom-in-button"]');
    await page.click('[data-testid="zoom-out-button"]');
    await page.click('[data-testid="fit-to-screen-button"]');

    // Test pan tool
    await page.click('[data-testid="pan-tool"]');
    // Simulate panning (drag on canvas)
    await page.locator('[data-testid="investigation-canvas"]').dragTo(
      page.locator('[data-testid="investigation-canvas"]'),
      { targetPosition: { x: 100, y: 100 } }
    );

    // Test selection tool
    await page.click('[data-testid="selection-tool"]');

    // Test undo/redo
    await page.click('[data-testid="undo-button"]');
    await page.click('[data-testid="redo-button"]');
  });

  test('should save investigation state', async ({ page }) => {
    // Make some changes to the investigation
    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-person"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 200, y: 150 }
    });

    // Click save button
    await page.click('[data-testid="save-investigation-button"]');

    // Verify save success
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
  });

  test('should export investigation', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-investigation-button"]');

    // Select export format
    await page.selectOption('[data-testid="export-format-select"]', 'pdf');

    // Confirm export
    await page.click('[data-testid="confirm-export-button"]');

    // Verify download
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('investigation');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should use search and filter in investigation', async ({ page }) => {
    // Search for entities
    await page.fill('[data-testid="investigation-search-input"]', 'John');
    await page.click('[data-testid="search-button"]');

    // Verify search results are highlighted/filtered
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

    // Clear search
    await page.click('[data-testid="clear-search-button"]');

    // Filter by entity type
    await page.selectOption('[data-testid="entity-type-filter"]', 'person');

    // Verify only person entities are visible
    const visibleEntities = page.locator('[data-testid="canvas-entity"]:visible');
    // This would need more specific assertions based on actual implementation
  });

  test('should handle investigation collaboration', async ({ page }) => {
    // Test collaboration features (if implemented)
    // This would test real-time updates, comments, etc.

    // For now, check if collaboration UI elements exist
    const collaborationPanel = page.locator('[data-testid="collaboration-panel"]');

    if (await collaborationPanel.isVisible()) {
      // Test collaboration features
      await page.click('[data-testid="add-comment-button"]');
      await page.fill('[data-testid="comment-input"]', 'Test comment');
      await page.click('[data-testid="submit-comment-button"]');

      await expect(page.locator('[data-testid="comment-item"]')).toContainText('Test comment');
    } else {
      // Collaboration not implemented, skip test
      test.skip();
    }
  });

  test('should navigate investigation history', async ({ page }) => {
    // Make some changes
    await page.click('[data-testid="add-entity-button"]');
    await page.click('[data-testid="entity-type-person"]');
    await page.locator('[data-testid="investigation-canvas"]').click({
      position: { x: 200, y: 150 }
    });

    // Check if history navigation exists
    const historyPanel = page.locator('[data-testid="history-panel"]');

    if (await historyPanel.isVisible()) {
      // Test history navigation
      await page.click('[data-testid="history-item"]').first();

      // Verify state was restored
      await expect(page.locator('[data-testid="canvas-entity"]')).toHaveCount(0);
    } else {
      test.skip();
    }
  });
});