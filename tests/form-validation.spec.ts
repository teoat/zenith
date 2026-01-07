/**
 * Form Validation and Error Handling E2E Tests
 * Tests form validation across the application
 */
import { test, expect } from '@playwright/test';

test.describe('Form Validation and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'analyst@378x492.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Login Form Validation', () => {
    test('shows validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('shows real-time validation feedback', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('[name="email"]');

      // Type invalid email
      await emailInput.fill('invalid');
      await emailInput.blur(); // Trigger validation

      // Should show validation error immediately
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();

      // Fix the email
      await emailInput.fill('valid@example.com');
      await emailInput.blur();

      // Error should disappear
      await expect(page.locator('text=Please enter a valid email address')).not.toBeVisible();
    });
  });

  test.describe('Case Creation Form Validation', () => {
    test('validates required case fields', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      // Try to submit without title
      await page.click('button:has-text("Continue")');

      // Should show validation error
      await expect(page.locator('text=Case title is required')).toBeVisible();
    });

    test('validates case title length', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      // Title too short
      await page.fill('#investigation-title', 'A');
      await page.click('button:has-text("Continue")');

      await expect(page.locator('text=Title must be at least 3 characters')).toBeVisible();

      // Title too long
      await page.fill('#investigation-title', 'A'.repeat(201));
      await page.click('button:has-text("Continue")');

      await expect(page.locator('text=Title must not exceed 200 characters')).toBeVisible();
    });

    test('validates subject information', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'Test Case');
      await page.click('button:has-text("Continue")');

      // On subjects step
      await page.click('button:has-text("Add Subject")');

      // Try to add subject without name
      await page.click('button:has-text("Save Subject")');

      await expect(page.locator('text=Subject name is required')).toBeVisible();
    });

    test('validates transaction data', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")'); // Skip subjects

      // On transactions step
      await page.click('button:has-text("Add Transaction")');

      // Try to save without amount
      await page.click('button:has-text("Save Transaction")');

      await expect(page.locator('text=Transaction amount is required')).toBeVisible();

      // Invalid amount
      await page.fill('[name="amount"]', '-100');
      await page.click('button:has-text("Save Transaction")');

      await expect(page.locator('text=Amount must be positive')).toBeVisible();
    });
  });

  test.describe('Settings Form Validation', () => {
    test('validates theme selection', async ({ page }) => {
      await page.goto('/settings');

      // Try invalid theme value (if form allows it)
      const themeSelect = page.locator('[data-testid="theme-select"]');
      if (await themeSelect.isVisible()) {
        // This should work with valid values
        await themeSelect.selectOption('dark');
        await expect(page.locator('html')).toHaveClass(/dark/);
      }
    });

    test('validates data retention settings', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=System');

      const retentionInput = page.locator('[data-testid="data-retention-input"]');

      // Invalid negative value
      await retentionInput.fill('-1');
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=Data retention must be positive')).toBeVisible();

      // Valid value
      await retentionInput.fill('90');
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=Data retention updated')).toBeVisible();
    });

    test('validates file size limits', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=System');

      const sizeInput = page.locator('[data-testid="max-file-size-input"]');

      // Invalid value (too large)
      await sizeInput.fill('1000'); // 1000MB
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=File size limit cannot exceed 500MB')).toBeVisible();

      // Valid value
      await sizeInput.fill('50');
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=File size limit updated')).toBeVisible();
    });
  });

  test.describe('Error States and Recovery', () => {
    test('handles network errors gracefully', async ({ page, context }) => {
      await context.setOffline(true);

      await page.goto('/cases');

      // Try to perform action that requires network
      await page.click('text=New Case');

      // Should show offline error
      await expect(page.locator('text=You are currently offline')).toBeVisible();

      // Go back online
      await context.setOffline(false);

      // Error should resolve
      await page.reload();
      await expect(page.locator('text=New Case')).toBeVisible();
    });

    test('shows server error messages', async ({ page }) => {
      // Mock server error
      await page.route('**/api/v1/cases', async route => {
        await route.fulfill({
          status: 500,
          json: { detail: 'Internal server error occurred' }
        });
      });

      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'Error Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      // Should show server error
      await expect(page.locator('text=Internal server error occurred')).toBeVisible();
    });

    test('handles validation errors from server', async ({ page }) => {
      // Mock validation error
      await page.route('**/api/v1/cases', async route => {
        await route.fulfill({
          status: 422,
          json: {
            detail: [
              { field: 'title', message: 'Title contains invalid characters' },
              { field: 'priority', message: 'Invalid priority level' }
            ]
          }
        });
      });

      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'Invalid@Title#$%');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      // Should show field-specific errors
      await expect(page.locator('text=Title contains invalid characters')).toBeVisible();
      await expect(page.locator('text=Invalid priority level')).toBeVisible();
    });

    test('retry mechanism works for failed requests', async ({ page }) => {
      let attemptCount = 0;

      // Mock intermittent failure
      await page.route('**/api/v1/cases', async route => {
        attemptCount++;
        if (attemptCount < 3) {
          await route.fulfill({ status: 503, json: { detail: 'Service unavailable' } });
        } else {
          await route.fulfill({
            status: 201,
            json: { id: '123', title: 'Retry Test Case' }
          });
        }
      });

      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'Retry Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Create Investigation")');

      // Should eventually succeed after retries
      await expect(page.locator('text=Retry Test Case')).toBeVisible();
    });
  });

  test.describe('File Upload Validation', () => {
    test('validates file size limits', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      // Navigate to evidence step
      await page.fill('#investigation-title', 'File Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');

      // Try to upload oversized file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'large-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(100 * 1024 * 1024) // 100MB file
      });

      await expect(page.locator('text=File size exceeds the maximum limit')).toBeVisible();
    });

    test('validates file types', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'File Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');

      // Try to upload invalid file type
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid-file.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('fake exe content')
      });

      await expect(page.locator('text=Invalid file format')).toBeVisible();
    });

    test('shows upload progress', async ({ page }) => {
      await page.goto('/cases');
      await page.click('text=New Case');

      await page.fill('#investigation-title', 'Upload Test Case');
      await page.click('button:has-text("Continue")');
      await page.click('button:has-text("Continue")');

      // Upload valid file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('PDF content')
      });

      // Should show upload progress
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

      // Should complete successfully
      await expect(page.locator('text=Upload complete')).toBeVisible();
    });
  });

  test.describe('Form Accessibility', () => {
    test('forms have proper ARIA labels', async ({ page }) => {
      await page.goto('/settings');

      // All form inputs should have labels or aria-labels
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const label = document.querySelector(`label[for="${id}"]`);

          return !!(ariaLabel || ariaLabelledBy || label);
        });

        expect(hasLabel).toBe(true);
      }
    });

    test('error messages are associated with fields', async ({ page }) => {
      await page.goto('/login');

      // Submit empty form to trigger errors
      await page.click('button[type="submit"]');

      // Error messages should be properly associated
      const errorMessage = page.locator('text=Email is required').first();
      await expect(errorMessage).toBeVisible();

      // Should have proper ARIA attributes
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    test('forms support keyboard navigation', async ({ page }) => {
      await page.goto('/login');

      // Tab through form fields
      await page.keyboard.press('Tab'); // Email field
      await expect(page.locator('[name="email"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password field
      await expect(page.locator('[name="password"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();

      // Enter should submit form
      await page.keyboard.press('Enter');
      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
    });
  });
});