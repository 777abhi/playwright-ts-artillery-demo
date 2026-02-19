import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from './world';

const presetIds: Record<string, string> = {
  'Optimal': 'preset-optimal',
  'DB Latency': 'preset-db-latency',
  'CPU Bound': 'preset-cpu-bound',
  'Memory Stress': 'preset-memory-stress',
};

const inputIds: Record<string, string> = {
  'Delay': '#delay-input',
  'CPU Load': '#cpu-input',
  'Memory Stress': '#memory-input',
};

When('I click the {string} preset button', async function (this: CustomWorld, presetName: string) {
  const id = presetIds[presetName];
  if (!id) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  await this.page!.click(`#${id}`);
});

Then('the {string} input should have value {string}', async function (this: CustomWorld, inputName: string, expectedValue: string) {
  const id = inputIds[inputName];
  if (!id) {
    throw new Error(`Unknown input: ${inputName}`);
  }
  await expect(this.page!.locator(id)).toHaveValue(expectedValue);
});
