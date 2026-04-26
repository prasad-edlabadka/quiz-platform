import { setWorldConstructor, World, IWorldOptions, Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, ChromiumBrowser, Page } from '@playwright/test';

export class CustomWorld extends World {
  browser?: ChromiumBrowser;
  page?: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch({ headless: true });
  const context = await this.browser.newContext();
  this.page = await context.newPage();
});

After(async function (this: CustomWorld) {
  if (this.page) {
    await this.page.close();
  }
  if (this.browser) {
    await this.browser.close();
  }
});
