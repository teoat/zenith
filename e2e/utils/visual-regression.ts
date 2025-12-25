// e2e/utils/visual-regression.ts
import { Page, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface VisualRegressionOptions {
  threshold?: number; // 0-1, default 0.1
  fullPage?: boolean;
  mask?: Array<{ x: number; y: number; width: number; height: number }>;
  updateScreenshots?: boolean;
}

export class VisualRegressionHelper {
  private baselineDir: string;
  private diffDir: string;
  private currentDir: string;

  constructor(testName: string) {
    this.baselineDir = join(process.cwd(), 'e2e', 'screenshots', 'baseline');
    this.diffDir = join(process.cwd(), 'e2e', 'screenshots', 'diff');
    this.currentDir = join(process.cwd(), 'e2e', 'screenshots', 'current');

    // Ensure directories exist
    [this.baselineDir, this.diffDir, this.currentDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async compareScreenshot(
    page: Page,
    screenshotName: string,
    options: VisualRegressionOptions = {}
  ): Promise<{ passed: boolean; diffPercentage?: number; diffPath?: string }> {
    const {
      threshold = 0.1,
      fullPage = true,
      mask = [],
      updateScreenshots = process.env.UPDATE_SCREENSHOTS === 'true'
    } = options;

    const screenshotPath = join(this.currentDir, `${screenshotName}.png`);
    const baselinePath = join(this.baselineDir, `${screenshotName}.png`);
    const diffPath = join(this.diffDir, `${screenshotName}.png`);

    // Take current screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage,
      mask: mask.map(m => page.locator(`[data-testid="${m.x}-${m.y}"]`))
    });

    // If baseline doesn't exist or we're updating, create it
    if (!existsSync(baselinePath) || updateScreenshots) {
      // Copy current to baseline
      writeFileSync(baselinePath, readFileSync(screenshotPath));
      console.log(`📸 Created baseline screenshot: ${screenshotName}`);
      return { passed: true };
    }

    // Load images
    const currentImg = PNG.sync.read(readFileSync(screenshotPath));
    const baselineImg = PNG.sync.read(readFileSync(baselinePath));

    // Create diff image
    const { width, height } = currentImg;
    const diffImg = new PNG({ width, height });

    // Compare images
    const diffPixels = pixelmatch(
      currentImg.data,
      baselineImg.data,
      diffImg.data,
      width,
      height,
      { threshold: 0.1 }
    );

    const totalPixels = width * height;
    const diffPercentage = diffPixels / totalPixels;

    // Save diff image if there are differences
    if (diffPixels > 0) {
      writeFileSync(diffPath, PNG.sync.write(diffImg));
    }

    const passed = diffPercentage <= threshold;

    if (!passed) {
      console.log(`❌ Visual regression detected: ${screenshotName}`);
      console.log(`   Difference: ${(diffPercentage * 100).toFixed(2)}%`);
      console.log(`   Threshold: ${(threshold * 100).toFixed(2)}%`);
      console.log(`   Diff saved: ${diffPath}`);
    } else {
      console.log(`✅ Visual test passed: ${screenshotName}`);
    }

    return {
      passed,
      diffPercentage,
      diffPath: diffPixels > 0 ? diffPath : undefined
    };
  }

  async compareElementScreenshot(
    page: Page,
    selector: string,
    screenshotName: string,
    options: Omit<VisualRegressionOptions, 'fullPage'> = {}
  ): Promise<{ passed: boolean; diffPercentage?: number; diffPath?: string }> {
    const element = page.locator(selector);
    await element.waitFor();

    return this.compareScreenshot(page, screenshotName, {
      ...options,
      fullPage: false
    });
  }
}

// Test utilities for common visual regression scenarios
export const visualTestUtils = {
  // Test dashboard components
  async testDashboardLayout(page: Page, helper: VisualRegressionHelper) {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const results = await Promise.all([
      helper.compareScreenshot(page, 'dashboard-overview'),
      helper.compareElementScreenshot(page, '[data-testid="metrics-grid"]', 'dashboard-metrics'),
      helper.compareElementScreenshot(page, '[data-testid="activity-feed"]', 'dashboard-activity')
    ]);

    return results.every(r => r.passed);
  },

  // Test case management interface
  async testCaseInterface(page: Page, helper: VisualRegressionHelper) {
    await page.goto('/cases');
    await page.waitForLoadState('networkidle');

    const results = await Promise.all([
      helper.compareScreenshot(page, 'cases-list'),
      helper.compareElementScreenshot(page, '[data-testid="case-filters"]', 'case-filters'),
      helper.compareElementScreenshot(page, '[data-testid="case-table"]', 'case-table')
    ]);

    return results.every(r => r.passed);
  },

  // Test investigation canvas
  async testInvestigationCanvas(page: Page, helper: VisualRegressionHelper) {
    await page.goto('/investigation/case-123');
    await page.waitForLoadState('networkidle');

    const results = await Promise.all([
      helper.compareScreenshot(page, 'investigation-canvas'),
      helper.compareElementScreenshot(page, '[data-testid="entity-panel"]', 'entity-panel'),
      helper.compareElementScreenshot(page, '[data-testid="tools-panel"]', 'tools-panel')
    ]);

    return results.every(r => r.passed);
  },

  // Test responsive design
  async testResponsiveDesign(page: Page, helper: VisualRegressionHelper) {
    await page.goto('/dashboard');

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    const desktopResult = await helper.compareScreenshot(page, 'dashboard-desktop');

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletResult = await helper.compareScreenshot(page, 'dashboard-tablet');

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileResult = await helper.compareScreenshot(page, 'dashboard-mobile');

    return desktopResult.passed && tabletResult.passed && mobileResult.passed;
  },

  // Test theme consistency
  async testThemeConsistency(page: Page, helper: VisualRegressionHelper) {
    await page.goto('/dashboard');

    // Test light theme
    await page.emulateMedia({ colorScheme: 'light' });
    const lightResult = await helper.compareScreenshot(page, 'dashboard-light-theme');

    // Test dark theme
    await page.emulateMedia({ colorScheme: 'dark' });
    const darkResult = await helper.compareScreenshot(page, 'dashboard-dark-theme');

    return lightResult.passed && darkResult.passed;
  }
};

// Playwright test fixture for visual regression
export const visualRegressionFixture = {
  async visualHelper({ page }, use) {
    const testName = expect.getState().currentTestName.replace(/[^a-zA-Z0-9]/g, '_');
    const helper = new VisualRegressionHelper(testName);

    await use(helper);
  }
};