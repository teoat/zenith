import { test, expect } from '@playwright/test';

test('Debug Login Page', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log(`PAGE ERROR: ${exception}`));

  console.log('Navigating to /login...');
  await page.goto('/login');
  
  console.log('Waiting for network idle...');
  await page.waitForLoadState('networkidle');

  console.log('Checking page content...');
  const content = await page.content();
  console.log('Page Content Length:', content.length);
  
  if (content.includes('Something went wrong')) {
      console.log('Found Error Boundary text!');
  }
  
  const bodyText = await page.innerText('body');
  console.log('Body Text:', bodyText);

  // Check if inputs exist
  const emailCount = await page.locator('[name="email"]').count();
  console.log('Email Input Count:', emailCount);

  if (emailCount === 0) {
      console.log('Looking for loading state...');
      const loading = await page.locator('text=Loading').count(); // Check for loading usage
      const svg = await page.locator('svg').count();
      console.log('Loading text count:', loading);
      console.log('SVG count:', svg);
  }
  
  await expect(page.locator('[name="email"]')).toBeVisible();
});
