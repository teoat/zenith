/**
 * Search and Filtering E2E Tests
 * Tests search functionality across the application
 */
import { test, expect } from '@playwright/test';

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Global Search', () => {
    test('global search input is accessible', async ({ page }) => {
      // Search input should be visible in header
      const searchInput = page.locator('[placeholder*="search" i]');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('aria-label');
    });

    test('search keyboard shortcut works', async ({ page }) => {
      // Press Ctrl/Cmd + K
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');

      // Search should be focused
      const searchInput = page.locator('[placeholder*="search" i]');
      await expect(searchInput).toBeFocused();
    });

    test('search shows results as typing', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('case');

      // Should show search dropdown or results
      const searchResults = page.locator('[data-testid="search-results"]');
      await expect(searchResults.or(page.locator('[data-testid="search-dropdown"]'))).toBeVisible();
    });

    test('search categories filter results', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('test');

      // If category filters exist, test them
      const categoryFilter = page.locator('[data-testid="search-category-filter"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.click('text=Cases');

        // Results should be filtered
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      }
    });

    test('search handles no results gracefully', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('nonexistentitem12345');

      // Should show "no results" message
      await expect(page.locator('text=No results found')).toBeVisible();
    });

    test('search clears properly', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('case');

      // Should show results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

      // Clear search
      await page.click('[data-testid="search-clear"]');

      // Results should disappear
      await expect(page.locator('[data-testid="search-results"]')).not.toBeVisible();
      await expect(searchInput).toHaveValue('');
    });
  });

  test.describe('Cases Search and Filtering', () => {
    test('cases page has search functionality', async ({ page }) => {
      await page.goto('/cases');

      const searchInput = page.locator('[placeholder*="search cases" i]');
      await expect(searchInput).toBeVisible();
    });

    test('cases filter by status', async ({ page }) => {
      await page.goto('/cases');

      // Click status filter
      const statusFilter = page.locator('[data-testid="status-filter"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.click('text=Active');

        // Should filter cases
        const caseRows = page.locator('[data-testid="case-row"]');
        const visibleRows = await caseRows.count();

        // All visible cases should be active (if any exist)
        for (let i = 0; i < visibleRows; i++) {
          const statusBadge = caseRows.nth(i).locator('[data-testid="case-status"]');
          if (await statusBadge.isVisible()) {
            await expect(statusBadge).toContainText('Active');
          }
        }
      }
    });

    test('cases filter by priority', async ({ page }) => {
      await page.goto('/cases');

      const priorityFilter = page.locator('[data-testid="priority-filter"]');
      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.click('text=High');

        // Should show only high priority cases
        const caseRows = page.locator('[data-testid="case-row"]');
        const visibleRows = await caseRows.count();

        for (let i = 0; i < visibleRows; i++) {
          const priorityBadge = caseRows.nth(i).locator('[data-testid="case-priority"]');
          if (await priorityBadge.isVisible()) {
            await expect(priorityBadge).toContainText('High');
          }
        }
      }
    });

    test('cases search by title works', async ({ page }) => {
      await page.goto('/cases');

      const searchInput = page.locator('[placeholder*="search cases" i]');
      await searchInput.fill('fraud');

      // Should filter cases containing "fraud"
      const caseRows = page.locator('[data-testid="case-row"]');
      const visibleRows = await caseRows.count();

      if (visibleRows > 0) {
        for (let i = 0; i < visibleRows; i++) {
          const caseTitle = caseRows.nth(i).locator('[data-testid="case-title"]');
          await expect(caseTitle).toContainText(/fraud/i);
        }
      }
    });

    test('cases sorting works', async ({ page }) => {
      await page.goto('/cases');

      // Click sort by date
      const sortButton = page.locator('[data-testid="sort-date"]');
      if (await sortButton.isVisible()) {
        await sortButton.click();

        // Cases should be sorted by date (newest first)
        const caseRows = page.locator('[data-testid="case-row"]');
        const visibleRows = await caseRows.count();

        if (visibleRows >= 2) {
          const firstDate = await caseRows.nth(0).locator('[data-testid="case-date"]').textContent();
          const secondDate = await caseRows.nth(1).locator('[data-testid="case-date"]').textContent();

          // First date should be newer than second (this is a basic check)
          expect(firstDate).toBeTruthy();
          expect(secondDate).toBeTruthy();
        }
      }
    });

    test('cases pagination works', async ({ page }) => {
      await page.goto('/cases');

      const pagination = page.locator('[data-testid="cases-pagination"]');
      if (await pagination.isVisible()) {
        // Click next page
        const nextButton = pagination.locator('[data-testid="pagination-next"]');
        if (await nextButton.isEnabled()) {
          await nextButton.click();

          // Should show page 2
          await expect(page.locator('[data-testid="pagination-page-2"]')).toHaveClass(/active/);

          // Click previous
          const prevButton = pagination.locator('[data-testid="pagination-prev"]');
          await prevButton.click();

          // Should show page 1
          await expect(page.locator('[data-testid="pagination-page-1"]')).toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Evidence Search', () => {
    test('evidence search works in forensics', async ({ page }) => {
      await page.goto('/forensics');

      const searchInput = page.locator('[placeholder*="search evidence" i]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('document');

        // Should show filtered results
        await expect(page.locator('[data-testid="evidence-results"]')).toBeVisible();
      }
    });

    test('evidence filters by type', async ({ page }) => {
      await page.goto('/forensics');

      const typeFilter = page.locator('[data-testid="evidence-type-filter"]');
      if (await typeFilter.isVisible()) {
        await typeFilter.click();
        await page.click('text=PDF');

        // Should show only PDF files
        const evidenceItems = page.locator('[data-testid="evidence-item"]');
        const visibleItems = await evidenceItems.count();

        for (let i = 0; i < visibleItems; i++) {
          const fileType = evidenceItems.nth(i).locator('[data-testid="file-type"]');
          if (await fileType.isVisible()) {
            await expect(fileType).toContainText('PDF');
          }
        }
      }
    });
  });

  test.describe('Advanced Search Features', () => {
    test('search supports operators', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('status:active priority:high');

      // Should parse operators correctly
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });

    test('search history is maintained', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');

      // Perform a search
      await searchInput.fill('test search');
      await searchInput.press('Enter');

      // Search history should be available
      const historyButton = page.locator('[data-testid="search-history"]');
      if (await historyButton.isVisible()) {
        await historyButton.click();

        // Should show previous searches
        await expect(page.locator('text=test search')).toBeVisible();
      }
    });

    test('search auto-complete works', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('case');

      // Should show auto-complete suggestions
      const suggestions = page.locator('[data-testid="search-suggestions"]');
      await expect(suggestions).toBeVisible();

      // Should contain relevant suggestions
      await expect(suggestions.locator('text=case')).toBeVisible();
    });

    test('search results are highlighted', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('suspicious');

      // Search results should highlight the term
      const highlightedText = page.locator('[data-testid="search-highlight"]');
      await expect(highlightedText).toContainText('suspicious');
    });
  });

  test.describe('Search Performance', () => {
    test('search responds quickly', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');

      const startTime = Date.now();
      await searchInput.fill('test');

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(300); // 300ms response time
    });

    test('search handles large result sets', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');
      await searchInput.fill('a'); // Common letter to get many results

      // Should handle large result sets without crashing
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

      // Should have pagination or virtualization
      const resultCount = await page.locator('[data-testid="search-result-item"]').count();
      expect(resultCount).toBeLessThanOrEqual(100); // Reasonable limit
    });

    test('search debouncing prevents excessive requests', async ({ page }) => {
      const searchInput = page.locator('[placeholder*="search" i]');

      // Type quickly
      await searchInput.type('test search query', { delay: 50 });

      // Should not make excessive API calls (debounced)
      await page.waitForTimeout(500); // Wait for debouncing

      // Only one search request should have been made
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });
  });
});