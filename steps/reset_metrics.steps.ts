import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { expect } from '@playwright/test';

When('I wait for the process to complete', async function (this: CustomWorld) {
  await this.page!.waitForSelector('.success-message', { timeout: 10000 });
});

Then('I should see non-zero metrics', async function (this: CustomWorld) {
  // Poll until metrics update
  await expect(async () => {
    // Locate the element containing "Requests:"
    const element = this.page!.locator('div', { hasText: /^Requests: \d+$/ }).first();
    const text = await element.textContent();
    const count = parseInt(text?.split(':')[1].trim() || '0');
    expect(count).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });
});

When('I click the "Reset Metrics" button', async function (this: CustomWorld) {
  await this.page!.click('#reset-metrics-button');
});

Then('the metrics should be reset to zero', async function (this: CustomWorld) {
  await expect(async () => {
    const element = this.page!.locator('div', { hasText: /^Requests: \d+$/ }).first();
    const text = await element.textContent();
    const count = parseInt(text?.split(':')[1].trim() || '0');
    expect(count).toBe(0);
  }).toPass({ timeout: 10000 });
});
