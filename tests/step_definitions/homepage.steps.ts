import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

Given('I navigate to the homepage {string}', async function (this: CustomWorld, url: string) {
  await this.page!.goto(url);
});

Then('I should see the page title loading successfully', async function (this: CustomWorld) {
  // Since we don't know the exact title, we'll just check that it has one.
  const title = await this.page!.title();
  expect(title).toBeDefined();
  expect(title.length).toBeGreaterThan(0);
});
