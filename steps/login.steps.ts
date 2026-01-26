import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { LoginPage } from '../pages/LoginPage';

Given('I am on the login page', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page!);
  await loginPage.goto();
});

When('I enter username {string} and password {string}', async function (this: CustomWorld, username: string, pass: string) {
  const loginPage = new LoginPage(this.page!);
  await loginPage.usernameInput.fill(username);
  await loginPage.passwordInput.fill(pass);
});

When('I click the login button', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page!);
  await loginPage.loginButton.click();
});

Then('I should see the inventory page', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page!);
  await loginPage.verifyInventoryVisible();
});
