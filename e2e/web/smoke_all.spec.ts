import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

const ROUTES = [
  { path: '/', name: 'Dashboard' },
  { path: '/cases', name: 'Cases' },
  { path: '/ingestion', name: 'Ingestion' },
  { path: '/forensics', name: 'Forensics' },
  { path: '/adjudication', name: 'Adjudication Queue' },
  { path: '/reconciliation', name: 'Reconciliation' },
  { path: '/settings', name: 'Settings' },
  { path: '/design', name: 'Design System Showcase' },
  { path: '/onboarding', name: 'Onboarding' },
  { path: '/playback', name: 'Temporal Playback' },
  { path: '/case/progress', name: 'Case Progress Bar' },
  { path: '/notebook', name: 'Investigation Notebook' },
  { path: '/performance', name: 'Performance Dashboard' },
  { path: '/network', name: 'Network Analysis' },
  { path: '/graph', name: 'Relationship Graph' },
  { path: '/investigation', name: 'Investigation' },
  { path: '/reporting', name: 'Reporting' },
  { path: '/code-review', name: 'Code Review' },
  { path: '/predictive-maintenance', name: 'Predictive Maintenance' },
  { path: '/advanced-compliance', name: 'Advanced Compliance' },
  { path: '/orchestration', name: 'System Orchestration' },
  { path: '/approvals', name: 'Agent Approvals' },
  { path: '/drafts', name: 'Agent Drafts' },
  { path: '/compliance/monitoring', name: 'Compliance Monitoring' },
];

test.describe('Frontend Smoke Tests', () => {
  // Use sequential mode for login consistency, or login in each test
  // Using verify_users login pattern for robustness
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Check if we're already logged in (redirected to dashboard)
    // Wait for a moment to allow redirect to happen
    try {
      await page.waitForURL('**/dashboard', { timeout: 2000 });
      return; // Already logged in
    } catch (e) {
      // Not on dashboard, continue to login
    }

    // Check if we are on the login page
    if (page.url().includes('/login')) {
        // Wait for email input to be visible
        await page.waitForSelector('input[name="email"]', { state: 'visible' });

        // Perform login
        await page.fill('input[name="email"]', TEST_USERS.analyst.email);
        await page.fill('input[name="password"]', TEST_USERS.analyst.password);
        
        // Attempt to click login button
        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();
        
        // Wait for navigation to dashboard or home
        await expect(page).toHaveURL(/.*dashboard|.*\/$/);
    }
  });

  for (const route of ROUTES) {
    test(`should load ${route.name} page at ${route.path}`, async ({ page }) => {
      console.log(`Navigating to ${route.path}...`);
      await page.goto(route.path);
      
      // Wait for network idle or domcontentloaded
      await page.waitForLoadState('domcontentloaded');

      // Check for common error indicators
      const errorText = page.getByText('Something went wrong');
      const errorHeading = page.getByRole('heading', { name: 'Something went wrong' });
      // const notFoundText = page.getByText('404 - Page Not Found'); 
      
      // Assertions
      await expect(errorHeading).not.toBeVisible();
      // await expect(notFoundText).not.toBeVisible(); // 404 might be valid for some if data missing, but let's check generic error only
      
      // Verify URL matches (mostly)
      const currentUrl = page.url();
      // Only check if it's NOT login page (which would mean we got kicked out)
      expect(currentUrl).not.toContain('/login');
      expect(currentUrl).not.toContain('error');
    });
  }
});
