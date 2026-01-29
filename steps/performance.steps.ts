import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { expect } from '@playwright/test';

Given('I open the performance app', async function (this: CustomWorld) {
  await this.page!.goto('http://localhost:3000');
});

When('I configure the app for high latency', async function (this: CustomWorld) {
  await this.page!.fill('#delay-input', '2000');
  await this.page!.click('#save-settings');
});

When('I trigger the process', async function (this: CustomWorld) {
  await this.page!.click('#trigger-process');
});

Then('I should see the success message', async function (this: CustomWorld) {
  await this.page!.waitForSelector('.success-message');
});
