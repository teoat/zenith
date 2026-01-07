/**
 * E2E Test: Graph Analytics & Visualization
 * Tests community detection, centrality analysis, and pattern recognition
 */

import { test, expect } from '@playwright/test';

test.describe('Graph Analytics Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('load and render graph visualization', async ({ page }) => {
    // Navigate to a case with graph data
    await page.goto('/cases/graph-test-case');
    
    // Click graph tab
    await page.click('[data-testid="tab-graph"]');
    
    // Wait for graph to load
    await expect(page.locator('[data-testid="graph-visualization"]')).toBeVisible({ timeout: 10000 });
    
    // Verify nodes are renderedelement
    const nodes = page.locator('[data-testid^="graph-node-"]');
    await expect(nodes.first()).toBeVisible();
    
    // Check for at least 5 nodes
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(5);
  });

  test('detect communities in graph', async ({ page }) => {
    await page.goto('/cases/graph-test-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Click community detection button
    await page.click('button:has-text("Detect Communities")');
    
    // Wait for analysis to complete
    await expect(page.locator('[data-testid="community-results"]')).toBeVisible({ timeout: 15000 });
    
    // Verify communities are displayed
    await expect(page.locator('[data-testid="community-count"]')).toContainText(/\d+ communities/i);
    
    // Check community visualization
    const communities = page.locator('[data-testid^="community-"]');
    expect(await communities.count()).toBeGreaterThan(0);
  });

  test('calculate node centrality', async ({ page }) => {
    await page.goto('/cases/graph-test-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Select a node
    await page.click('[data-testid="graph-node-1"]');
    
    // View centrality metrics
    await page.click('button:has-text("Analyze Node")');
    
    // Verify centrality metrics displayed
    await expect(page.locator('[data-testid="pagerank-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="betweenness-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="degree-centrality"]')).toBeVisible();
    
    // Scores should be numeric
    const pagerank = await page.locator('[data-testid="pagerank-score"]').textContent();
    expect(parseFloat(pagerank || '0')).toBeGreaterThan(0);
  });

  test('find shortest path between nodes', async ({ page }) => {
    await page.goto('/cases/graph-test-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Enable path finding mode
    await page.click('button:has-text("Find Path")');
    
    // Click source node
    await page.click('[data-testid="graph-node-1"]');
    
    // Click target node
    await page.click('[data-testid="graph-node-5"]');
    
    // Verify path is highlighted
    await expect(page.locator('[data-testid="path-visualization"]')).toBeVisible();
    
    // Check path details
    await expect(page.locator('[data-testid="path-length"]')).toContainText(/\d+ hops/i);
    await expect(page.locator('[data-testid="path-risk-score"]')).toBeVisible();
  });

  test('detect circular transaction patterns', async ({ page }) => {
    await page.goto('/cases/graph-test-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Run pattern detection
    await page.click('button:has-text("Detect Patterns")');
    
    // Wait for analysis
    await expect(page.locator('[data-testid="pattern-results"]')).toBeVisible({ timeout: 15000 });
    
    // Check for circular patterns
    const circularPatterns = page.locator('[data-testid^="circular-pattern-"]');
    
    if (await circularPatterns.count() > 0) {
      // Click on first pattern
      await circularPatterns.first().click();
      
      // Verify pattern details
      await expect(page.locator('[data-testid="pattern-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="cycle-length"]')).toBeVisible();
      await expect(page.locator('[data-testid="risk-assessment"]')).toBeVisible();
    }
  });

  test('filter graph by time period', async ({ page }) => {
    await page.goto('/cases/graph-test-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Set date range
    await page.fill('[data-testid="date-from"]', '2026-01-01');
    await page.fill('[data-testid="date-to"]', '2026-01-31');
    
    await page.click('button:has-text("Apply Filters")');
    
    // Graph should update
    await page.waitForTimeout(2000);
    
    // Verify filtered state
    await expect(page.locator('[data-testid="filter-indicator"]')).toContainText('Filtered');
  });

  test('export graph data', async ({ page }) => {
    await page.goto('/cases/graph-test-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await page.click('button:has-text("Export")');
    await page.click('button:has-text("Export as JSON")');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('graph performance with large dataset', async ({ page }) => {
    //Navigate to case with 100+ nodes
    await page.goto('/cases/large-graph-case');
    await page.click('[data-testid="tab-graph"]');
    
    // Measure load time
    const startTime = Date.now();
    
    await expect(page.locator('[data-testid="graph-visualization"]')).toBeVisible({ timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 30 seconds
    expect(loadTime).toBeLessThan(30000);
    
    // Verify nodes rendered
    const nodeCount = await page.locator('[data-testid^="graph-node-"]').count();
    expect(nodeCount).toBeGreaterThan(50);
  });
});
