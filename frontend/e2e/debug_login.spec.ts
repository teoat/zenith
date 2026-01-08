import { test, expect } from '@playwright/test';

test('debug login page', async ({ page }) => {
  console.log('--- START DEBUG ---');
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

  try {
    const response = await page.goto('/login');
    console.log(`Navigation status: ${response?.status()}`);
  } catch (e) {
    console.log(`Navigation failed: ${e}`);
  }

  await page.waitForTimeout(5000);
  
  // Check for email input
  const email = await page.$('input[name="email"]');
  console.log(`Email input found: ${!!email}`);

  if (!email) {
     const content = await page.content();
     console.log('PAGE CONTENT SNAPSHOT:', content.substring(0, 1000)); // First 1000 chars
  }
  console.log('--- END DEBUG ---');
});
