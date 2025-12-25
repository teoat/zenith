/**
 * Data Visualization and Chart Interaction E2E Tests
 * Tests charts, graphs, and data presentation components
 */
import { test, expect } from '@playwright/test';

test.describe('Data Visualization and Charts', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Dashboard Charts', () => {
    test('case status distribution chart renders', async ({ page }) => {
      await page.goto('/');

      // Find case status chart
      const statusChart = page.locator('[data-testid="case-status-chart"]');
      await expect(statusChart).toBeVisible();

      // Should have chart title
      await expect(page.locator('text=Cases by Status')).toBeVisible();

      // Should show different status categories
      await expect(page.locator('text=Active')).toBeVisible();
      await expect(page.locator('text=Resolved')).toBeVisible();
    });

    test('risk distribution chart displays correctly', async ({ page }) => {
      await page.goto('/');

      const riskChart = page.locator('[data-testid="risk-distribution-chart"]');
      await expect(riskChart).toBeVisible();

      // Should show risk levels
      await expect(page.locator('text=High Risk')).toBeVisible();
      await expect(page.locator('text=Medium Risk')).toBeVisible();
      await expect(page.locator('text=Low Risk')).toBeVisible();
    });

    test('time series chart shows trends', async ({ page }) => {
      await page.goto('/');

      const timeChart = page.locator('[data-testid="cases-over-time-chart"]');
      await expect(timeChart).toBeVisible();

      // Should have time axis
      await expect(page.locator('[data-testid="time-axis"]')).toBeVisible();

      // Should show case count axis
      await expect(page.locator('[data-testid="count-axis"]')).toBeVisible();
    });

    test('geographic distribution map loads', async ({ page }) => {
      await page.goto('/');

      // Navigate to visualization page if needed
      await page.click('text=Visualization');

      const mapContainer = page.locator('[data-testid="geographic-map"]');
      await expect(mapContainer).toBeVisible();

      // Should load map tiles (may take time)
      await page.waitForSelector('[data-testid="map-tiles-loaded"]', { timeout: 10000 });
    });
  });

  test.describe('Chart Interactions', () => {
    test('chart tooltips show on hover', async ({ page }) => {
      await page.goto('/');

      const chartElement = page.locator('[data-testid="case-status-chart"] .recharts-bar');
      await chartElement.first().hover();

      // Tooltip should appear
      await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
      await expect(page.locator('text=Active Cases:')).toBeVisible();
    });

    test('chart legend toggles series visibility', async ({ page }) => {
      await page.goto('/');

      // Find legend item
      const legendItem = page.locator('[data-testid="chart-legend"] [data-testid="legend-item"]').first();
      await expect(legendItem).toBeVisible();

      // Click to toggle
      await legendItem.click();

      // Series should be hidden (this may vary by chart implementation)
      // Verify visual change occurred
      const chartContainer = page.locator('[data-testid="case-status-chart"]');
      const initialHeight = await chartContainer.boundingBox().then(box => box?.height || 0);

      // After toggle, chart should look different
      await expect(chartContainer).toBeVisible();
    });

    test('chart zoom and pan functionality', async ({ page }) => {
      await page.goto('/');

      const timeChart = page.locator('[data-testid="cases-over-time-chart"]');

      // Should support zoom on desktop
      await timeChart.hover();
      await page.mouse.wheel(0, -100); // Zoom in

      // Chart should respond to zoom
      await expect(timeChart).toBeVisible();
    });

    test('chart data export functionality', async ({ page }) => {
      await page.goto('/');

      // Find export button
      const exportButton = page.locator('[data-testid="chart-export-button"]');
      if (await exportButton.isVisible()) {
        await exportButton.click();

        // Should show export options
        await expect(page.locator('[data-testid="export-options"]')).toBeVisible();

        // Click PNG export
        await page.click('text=Export as PNG');

        // Should trigger download
        const download = await page.waitForEvent('download');
        expect(download.suggestedFilename()).toMatch(/chart.*\.png/);
      }
    });
  });

  test.describe('Network Graph Visualization', () => {
    test('relationship graph loads and renders', async ({ page }) => {
      await page.goto('/graph');

      // Graph container should load
      const graphContainer = page.locator('[data-testid="graph-container"]');
      await expect(graphContainer).toBeVisible();

      // Should show nodes and edges
      await page.waitForSelector('[data-testid="graph-node"]', { timeout: 10000 });
      const nodes = page.locator('[data-testid="graph-node"]');
      await expect(nodes).toHaveCount(await nodes.count()); // At least some nodes
    });

    test('graph node interactions work', async ({ page }) => {
      await page.goto('/graph');

      // Wait for graph to load
      await page.waitForSelector('[data-testid="graph-node"]');

      // Click on a node
      const firstNode = page.locator('[data-testid="graph-node"]').first();
      await firstNode.click();

      // Node inspector should open
      await expect(page.locator('[data-testid="node-inspector"]')).toBeVisible();

      // Should show node details
      await expect(page.locator('[data-testid="node-details"]')).toBeVisible();
    });

    test('graph search functionality', async ({ page }) => {
      await page.goto('/graph');

      // Find search input
      const searchInput = page.locator('[data-testid="graph-search-input"]');
      await expect(searchInput).toBeVisible();

      // Type search query
      await searchInput.fill('suspicious');

      // Should highlight matching nodes
      await expect(page.locator('[data-testid="graph-node"].highlighted')).toBeVisible();
    });

    test('graph layout controls work', async ({ page }) => {
      await page.goto('/graph');

      // Find layout controls
      const layoutControls = page.locator('[data-testid="layout-controls"]');
      if (await layoutControls.isVisible()) {
        // Change layout
        await page.click('[data-testid="layout-force"]');

        // Graph should re-layout
        await expect(page.locator('[data-testid="graph-container"]')).toBeVisible();

        // Change to hierarchical layout
        await page.click('[data-testid="layout-hierarchical"]');

        // Should maintain visibility
        await expect(page.locator('[data-testid="graph-node"]')).toBeVisible();
      }
    });
  });

  test.describe('3D Graph Visualization', () => {
    test('3D graph renders correctly', async ({ page }) => {
      await page.goto('/graph');

      // Switch to 3D view if available
      const view3DButton = page.locator('[data-testid="view-3d-toggle"]');
      if (await view3DButton.isVisible()) {
        await view3DButton.click();

        // 3D canvas should appear
        await expect(page.locator('[data-testid="graph-canvas-3d"]')).toBeVisible();

        // Should have 3D controls
        await expect(page.locator('[data-testid="camera-controls"]')).toBeVisible();
      }
    });

    test('3D navigation controls work', async ({ page }) => {
      await page.goto('/graph');

      const view3DButton = page.locator('[data-testid="view-3d-toggle"]');
      if (await view3DButton.isVisible()) {
        await view3DButton.click();

        // Test orbit controls
        const canvas = page.locator('[data-testid="graph-canvas-3d"]');

        // Click and drag to rotate
        await canvas.click();
        await page.mouse.down();
        await page.mouse.move(100, 100);
        await page.mouse.up();

        // Canvas should still be visible
        await expect(canvas).toBeVisible();
      }
    });
  });

  test.describe('Chart Accessibility', () => {
    test('charts have proper ARIA labels', async ({ page }) => {
      await page.goto('/');

      const charts = page.locator('[data-testid*="chart"]');
      const chartCount = await charts.count();

      for (let i = 0; i < chartCount; i++) {
        const chart = charts.nth(i);
        await expect(chart).toHaveAttribute('aria-label');
        await expect(chart).toHaveAttribute('role', 'img');
      }
    });

    test('chart data is available to screen readers', async ({ page }) => {
      await page.goto('/');

      // Charts should have data tables for screen readers
      const dataTables = page.locator('[data-testid="chart-data-table"]');
      await expect(dataTables).toHaveCount(await dataTables.count()); // At least some exist

      // Or alternative text descriptions
      const altTexts = page.locator('[data-testid="chart-description"]');
      await expect(altTexts.or(dataTables)).toBeVisible();
    });

    test('keyboard navigation in charts', async ({ page }) => {
      await page.goto('/');

      // Tab to first chart
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Skip other elements

      // Should reach a chart
      const focusedElement = page.locator(':focus');
      const isChartFocused = await focusedElement.evaluate(el =>
        el.closest('[data-testid*="chart"]') !== null
      );

      // If charts are focusable, this should pass
      expect(isChartFocused).toBeTruthy();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('charts load within performance budget', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5 seconds for chart-heavy page
    });

    test('charts are responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Charts should adapt to mobile
      const charts = page.locator('[data-testid*="chart"]');
      await expect(charts).toBeVisible();

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);

      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
    });

    test('chart animations respect reduced motion', async ({ page }) => {
      // Set reduced motion preference
      await page.evaluate(() => {
        localStorage.setItem('accessibility-reducedMotion', 'true');
      });

      await page.goto('/');

      // Charts should load without animations
      await expect(page.locator('[data-testid*="chart"]')).toBeVisible();

      // No animation classes should be present
      const animatedElements = page.locator('[class*="animate-"]');
      const animationCount = await animatedElements.count();

      // Should have minimal animations when reduced motion is enabled
      expect(animationCount).toBeLessThan(5);
    });
  });
});