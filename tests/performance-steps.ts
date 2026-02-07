import { Page } from '@playwright/test';

export async function runPerformanceFlow(page: Page) {
  // Navigate to app
  await page.goto('http://localhost:3000');

  // Configure for High Latency
  await page.fill('#delay-input', '2000');
  await page.click('#save-settings');

  // Measure the Action
  const startTime = Date.now();
  await page.click('#trigger-process');
  await page.waitForSelector('.success-message');

  const duration = Date.now() - startTime;
  console.log(`Transaction completed in ${duration}ms`);
}
