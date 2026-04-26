import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

Given('I load the Revise application', async function (this: CustomWorld) {
  await this.page!.goto('http://localhost:5173');
});

Then('I should see the {string} title', async function (this: CustomWorld, expectedTitle: string) {
  await expect(this.page!.locator('text="Revise"').first()).toBeVisible();
});

Then('the application should be in the default landing state', async function (this: CustomWorld) {
  // Assuming LandingFeatures component contains something specific like "Why Revise?"
  await expect(this.page!.locator('text="Features"').first()).toBeVisible();
});

When('I click on the {string} navigation tab', async function (this: CustomWorld, tabName: string) {
  await this.page!.locator(`button:has-text("${tabName}")`).first().click();
});

Then('the application URL should update to include {string}', async function (this: CustomWorld, expectedRoute: string) {
  await expect(this.page!).toHaveURL(new RegExp(`${expectedRoute}`));
});
