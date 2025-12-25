/**
 * Critical User Journey E2E Tests
 * Testing complete user workflows from authentication to case resolution
 * Target: Achieve 95%+ test coverage for critical paths
 */
import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.describe('Complete Analyst Workflow', () => {
    test('full case lifecycle from creation to resolution', async ({ page }) => {
      // 1. Login
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/');

      // 2. Navigate to cases
      await page.click('text=Case Management');
      await expect(page).toHaveURL('/cases');

      // 3. Create new case
      await page.click('text=New Case');
      await expect(page.locator('text=Create New Investigation')).toBeVisible();

      // Fill case wizard
      await page.fill('#investigation-title', 'Complete Workflow Test Case');
      await page.fill('[name="description"]', 'Testing complete user journey');
      await page.selectOption('[name="priority"]', 'HIGH');
      await page.selectOption('[name="case_type"]', 'FRAUD_SUSPECTED');

      // Add subject
      await page.click('text=Add Subject');
      await page.fill('[name="subject_name"]', 'John Suspicious');
      await page.selectOption('[name="subject_type"]', 'INDIVIDUAL');
      await page.click('text=Save Subject');

      await page.click('button:has-text("Continue")');

      // Add transaction
      await page.click('text=Add Transaction');
      await page.fill('[name="amount"]', '9500');
      await page.fill('[name="merchant"]', 'Luxury Store Inc');
      await page.fill('[name="date"]', '2025-01-15');
      await page.click('text=Save Transaction');

      await page.click('button:has-text("Continue")');

      // Upload evidence
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'bank-statement.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content for testing')
      });
      await expect(page.locator('text=Upload complete')).toBeVisible();

      await page.click('button:has-text("Continue")');

      // Review and create
      await page.click('button:has-text("Create Investigation")');

      // Verify case created
      await expect(page.locator('text=Complete Workflow Test Case')).toBeVisible();

      // 4. Analyze case
      await page.click('button:has-text("Analyze")');
      await page.waitForSelector('.fraud-score', { timeout: 15000 });
      const riskScore = await page.locator('.fraud-score').textContent();
      expect(parseFloat(riskScore || '0')).toBeGreaterThan(0);

      // 5. Add investigation notes
      await page.click('text=Add Note');
      await page.fill('[name="noteContent"]', 'Initial investigation findings: structuring pattern detected');
      await page.click('button:has-text("Save Note")');
      await expect(page.locator('text=Initial investigation findings')).toBeVisible();

      // 6. Update case status
      await page.selectOption('[name="status"]', 'INVESTIGATING');
      await page.click('button:has-text("Update Status")');
      await expect(page.locator('text=Status updated')).toBeVisible();

      // 7. Assign to team member
      await page.selectOption('[name="assignee"]', 'investigator@378x492.com');
      await page.click('button:has-text("Assign")');
      await expect(page.locator('text=Case assigned')).toBeVisible();

      // 8. Generate report
      await page.click('text=Generate Report');
      await page.click('text=PDF Report');
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toMatch(/report.*\.pdf/);

      // 9. Close case
      await page.selectOption('[name="status"]', 'CLOSED');
      await page.fill('[name="resolution_notes"]', 'Case resolved: Confirmed structuring fraud pattern');
      await page.click('button:has-text("Close Case")');
      await expect(page.locator('text=Case closed successfully')).toBeVisible();

      // 10. Verify in case list
      await page.goto('/cases');
      await expect(page.locator('text=Complete Workflow Test Case')).toBeVisible();
      await expect(page.locator('text=CLOSED')).toBeVisible();
    });

    test('collaborative investigation workflow', async ({ page, context }) => {
      // Analyst 1 creates case
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      await page.goto('/cases');
      await page.click('text=New Case');
      await page.fill('#investigation-title', 'Collaboration Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      const caseUrl = page.url();

      // Analyst 2 joins investigation
      const page2 = await context.newPage();
      await page2.goto('/login');
      await page2.fill('[name="email"]', 'investigator@378x492.com');
      await page2.fill('[name="password"]', 'Test123!');
      await page2.click('button[type="submit"]');
      await page2.goto(caseUrl);

      // Analyst 1 adds finding
      await page.click('text=Add Note');
      await page.fill('[name="noteContent"]', 'Found suspicious transaction pattern');
      await page.click('button:has-text("Save Note")');

      // Analyst 2 sees real-time update
      await expect(page2.locator('text=Found suspicious transaction pattern')).toBeVisible({ timeout: 10000 });

      // Analyst 2 adds evidence
      await page2.click('text=Upload Evidence');
      const fileInput2 = page2.locator('input[type="file"]');
      await fileInput2.setInputFiles({
        name: 'analysis-report.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Analysis report content')
      });

      // Analyst 1 sees evidence update
      await expect(page.locator('text=analysis-report.pdf')).toBeVisible();

      // Both analysts can see presence indicators
      await expect(page.locator('.user-presence')).toContainText('2 analysts');
      await expect(page2.locator('.user-presence')).toContainText('2 analysts');
    });
  });

  test.describe('Administrative Workflows', () => {
    test('user management and permissions', async ({ page }) => {
      // Admin login
      await page.goto('/login');
      await page.fill('[name="email"]', 'admin@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      // Navigate to admin panel
      await page.goto('/admin');

      // User management
      await page.click('text=User Management');
      await expect(page.locator('text=System Users')).toBeVisible();

      // Add new user
      await page.click('text=Add User');
      await page.fill('[name="email"]', 'newuser@378x492.com');
      await page.fill('[name="full_name"]', 'New Analyst');
      await page.selectOption('[name="role"]', 'ANALYST');
      await page.click('button:has-text("Create User")');

      await expect(page.locator('text=User created successfully')).toBeVisible();

      // Modify permissions
      await page.click('text=Permissions');
      await page.check('[name="can_create_cases"]');
      await page.check('[name="can_upload_evidence"]');
      await page.click('button:has-text("Save Permissions")');

      await expect(page.locator('text=Permissions updated')).toBeVisible();
    });

    test('system configuration and monitoring', async ({ page }) => {
      // Admin login
      await page.goto('/login');
      await page.fill('[name="email"]', 'admin@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      // System monitoring
      await page.goto('/admin/monitoring');
      await expect(page.locator('text=System Health')).toBeVisible();

      // Check metrics
      await expect(page.locator('[data-testid="cpu-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="db-connections"]')).toBeVisible();

      // Configuration management
      await page.click('text=System Settings');
      await expect(page.locator('text=Configuration')).toBeVisible();

      // Update settings
      await page.fill('[name="max_file_size"]', '100');
      await page.fill('[name="session_timeout"]', '480'); // 8 hours
      await page.click('button:has-text("Save Configuration")');

      await expect(page.locator('text=Configuration updated')).toBeVisible();
    });
  });

  test.describe('Advanced Features Testing', () => {
    test('AI-powered fraud detection', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      await page.goto('/cases');
      await page.click('text=New Case');
      await page.fill('#investigation-title', 'AI Detection Test');

      // Add multiple suspicious transactions
      await page.click('button:has-text("Continue")');
      for (let i = 1; i <= 8; i++) {
        await page.click('text=Add Transaction');
        await page.fill('[name="amount"]', '9900'); // Just under $10k threshold
        await page.fill('[name="merchant"]', `Store ${i}`);
        await page.fill('[name="date"]', `2025-01-${String(i).padStart(2, '0')}`);
        await page.click('text=Save Transaction');
      }

      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      // AI analysis should detect structuring pattern
      await page.click('button:has-text("AI Analysis")');
      await page.waitForSelector('[data-testid="ai-insights"]', { timeout: 30000 });

      // Verify AI detected structuring
      await expect(page.locator('text=Structuring Pattern Detected')).toBeVisible();
      await expect(page.locator('[data-testid="ai-confidence"]')).toBeVisible();

      // AI recommendations should be present
      await expect(page.locator('text=Recommended Actions')).toBeVisible();
    });

    test('real-time collaboration features', async ({ page, context }) => {
      // Multiple users working simultaneously
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      await page.goto('/cases');
      await page.click('text=New Case');
      await page.fill('#investigation-title', 'Realtime Collaboration Test');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      const caseUrl = page.url();

      // Second user joins
      const page2 = await context.newPage();
      await page2.goto('/login');
      await page2.fill('[name="email"]', 'investigator@378x492.com');
      await page2.fill('[name="password"]', 'Test123!');
      await page2.click('button[type="submit"]');
      await page2.goto(caseUrl);

      // Test real-time typing indicators
      await page.type('[data-testid="note-input"]', 'Starting investigation...');
      await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible();

      // Test conflict resolution
      await page.fill('[data-testid="case-priority"]', 'CRITICAL');
      await page.click('button:has-text("Update")');

      await page2.fill('[data-testid="case-priority"]', 'HIGH');
      await page2.click('button:has-text("Update")');

      // System should handle conflicts gracefully
      await expect(page.locator('text=Priority updated')).toBeVisible();
      await expect(page2.locator('text=Priority updated')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('network failure recovery', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      await page.goto('/cases');

      // Simulate network failure
      await page.route('**/api/cases', route => route.abort());

      await page.click('text=New Case');
      await page.fill('#investigation-title', 'Network Failure Test');
      await page.click('button:has-text("Continue")');

      // Should show error and retry option
      await expect(page.locator('text=Network error occurred')).toBeVisible();
      await expect(page.locator('text=Retry')).toBeVisible();

      // Restore network and retry
      await page.unroute('**/api/cases');
      await page.click('text=Retry');

      // Should proceed normally
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');
      await expect(page.locator('text=Network Failure Test')).toBeVisible();
    });

    test('large file upload handling', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      await page.goto('/cases');
      await page.click('text=New Case');
      await page.fill('#investigation-title', 'Large File Test');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');

      // Upload large file (simulate 50MB)
      const largeFile = Buffer.alloc(50 * 1024 * 1024, 'x'); // 50MB of data
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'large-evidence.zip',
        mimeType: 'application/zip',
        buffer: largeFile
      });

      // Should show progress and handle gracefully
      await expect(page.locator('text=Uploading...')).toBeVisible();
      await page.waitForSelector('text=Upload complete', { timeout: 120000 });

      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');
      await expect(page.locator('text=Large File Test')).toBeVisible();
    });

    test('concurrent user conflicts', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'analyst@378x492.com');
      await page.fill('[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      await page.goto('/cases');
      await page.click('text=New Case');
      await page.fill('#investigation-title', 'Conflict Test');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      const caseUrl = page.url();

      // Second user opens same case
      const page2 = await context.newPage();
      await page2.goto('/login');
      await page2.fill('[name="email"]', 'investigator@378x492.com');
      await page2.fill('[name="password"]', 'Test123!');
      await page2.click('button[type="submit"]');
      await page2.goto(caseUrl);

      // Both users try to update simultaneously
      await page.selectOption('[name="status"]', 'INVESTIGATING');
      await page.click('button:has-text("Update Status")');

      await page2.selectOption('[name="status"]', 'CLOSED');
      await page2.click('button:has-text("Update Status")');

      // System should handle conflict and show appropriate messages
      await expect(page.locator('text=Status updated')).toBeVisible();
      await expect(page2.locator('text=Conflict detected')).toBeVisible();
    });
  });
});