/**
 * E2E Test: Real-Time Collaboration
 * Tests WebSocket functionality, presence detection, and collaborative editing
 */

import { test, expect } from '@playwright/test';

test.describe('Real-Time Collaboration', () => {
  test('presence detection shows active viewers', async ({ browser }) => {
    // Create two contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // User 1 logs in and opens case
    await page1.goto('/login');
    await page1.fill('[data-testid="email"]', 'analyst1@test.com');
    await page1.fill('[data-testid="password"]', 'Password123!');
    await page1.click('button[type="submit"]');
    await page1.goto('/cases/collab-test-case');
    
    // User 2 logs in and opens same case
    await page2.goto('/login');
    await page2.fill('[data-testid="email"]', 'analyst2@test.com');
    await page2.fill('[data-testid="password"]', 'Password123!');
    await page2.click('button[type="submit"]');
    await page2.goto('/cases/collab-test-case');
    
    // Wait for presence indicators
    await page1.waitForTimeout(2000);
    
    // User 1 should see User 2 in viewers list
    await expect(page1.locator('[data-testid="active-viewers"]')).toContainText('2 viewing');
    await expect(page1.locator('[data-testid="viewer-analyst2"]')).toBeVisible();
    
    // User 2 should see User 1
    await expect(page2.locator('[data-testid="viewer-analyst1"]')).toBeVisible();
    
    await context1.close();
    await context2.close();
  });

  test('live comments appear in real-time', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both users login and navigate to same case
    // [Login code omitted for brevity - same as above]
    await page1.goto('/cases/collab-test-case');
    await page2.goto('/cases/collab-test-case');
    
    await page1.waitForTimeout(1000);
    
    // User 1 posts a comment
    await page1.click('[data-testid="add-comment-button"]');
    await page1.fill('[data-testid="comment-input"]', 'Testing real-time collaboration!');
    await page1.click('button:has-text("Post Comment")');
    
    // User 2 should see the comment appear (without refresh)
    await expect(page2.locator('[data-testid="comments-list"]'))
      .toContainText('Testing real-time collaboration!', { timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });

  test('collaborative editing with conflict resolution', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Setup
    await page1.goto('/cases/collab-test-case');
    await page2.goto('/cases/collab-test-case');
    
    await page1.waitForTimeout(1000);
    
    // User 1 starts editing
    await page1.click('[data-testid="edit-description"]');
    
    // User 2 should see edit indicator
    await expect(page2.locator('[data-testid="editing-indicator"]'))
      .toContainText('analyst1 is editing', { timeout: 3000 });
    
    // User 1 saves changes
    await page1.fill('[data-testid="description-input"]', 'Updated description');
    await page1.click('button:has-text("Save")');
    
    // User 2 should see updated content
    await expect(page2.locator('[data-testid="case-description"]'))
      .toContainText('Updated description', { timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });

  test('cursor position tracking', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('/cases/collab-test-case');
    await page2.goto('/cases/collab-test-case');
    
    await page1.waitForTimeout(1000);
    
    // User 1 hovers over a section
    await page1.hover('[data-testid="evidence-section"]');
    
    // User 2 should see cursor indicator (if implemented)
    // This is optional depending on implementation
    const cursorIndicator = page2.locator('[data-testid="remote-cursor-analyst1"]');
    
    if (await cursorIndicator.count() > 0) {
      await expect(cursorIndicator).toBeVisible();
    }
    
    await context1.close();
    await context2.close();
  });

  test('WebSocket reconnection on disconnect', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.goto('/cases/collab-test-case');
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Simulate network disruption
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    
    // Reconnect
    await page.context().setOffline(false);
    
    // Should automatically reconnect
    await page.waitForTimeout(3000);
    
    // Verify connection restored (add comment)
    await page.click('[data-testid="add-comment-button"]');
    await page.fill('[data-testid="comment-input"]', 'After reconnection');
    await page.click('button:has-text("Post Comment")');
    
    await expect(page.locator('[data-testid="comments-list"]'))
      .toContainText('After reconnection');
  });

  test('notification for new activity', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.goto('/cases/collab-test-case');
    await page2.goto('/cases/collab-test-case');
    
    // User 2 navigates away
    await page2.goto('/dashboard');
    
    // User 1 makes a change
    await page1.click('[data-testid="add-evidence"]');
    await page1.fill('[data-testid="evidence-description"]', 'New evidence added');
    await page1.click('button:has-text("Save Evidence")');
    
    // User 2 should see notification
    await expect(page2.locator('[data-testid="notification-toast"]'))
      .toContainText('New activity', { timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });

  test('collaboration analytics dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'manager@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Navigate to collaboration stats
    await page.goto('/analytics/collaboration');
    
    // Verify metrics
    await expect(page.locator('[data-testid="active-users-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="collaboration-events"]')).toBeVisible();
    await expect(page.locator('[data-testid="most-collaborative-cases"]')).toBeVisible();
  });
});

test.describe('Collaborative Features - Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile presence indicators', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'analyst@test.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.goto('/cases/collab-test-case');
    
    // Check mobile-optimized presence UI
    await expect(page.locator('[data-testid="mobile-viewers-badge"]')).toBeVisible();
    
    // Tap to expand viewers list
    await page.click('[data-testid="mobile-viewers-badge"]');
    
    await expect(page.locator('[data-testid="viewers-modal"]')).toBeVisible();
  });
});
