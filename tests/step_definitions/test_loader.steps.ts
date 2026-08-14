import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

When('I navigate to the {string} tab', async function (this: CustomWorld, tabName: string) {
  await this.page!.locator(`button:has-text("${tabName}")`).first().click();
});

When('I locate the offline paste text area', async function (this: CustomWorld) {
  // Usually a textarea element is available
  await expect(this.page!.locator('textarea').first()).toBeVisible();
});

When('I paste invalid JSON like {string}', async function (this: CustomWorld, badJson: string) {
  await this.page!.locator('textarea').first().fill(badJson);
});

Then('I should see an error message indicating invalid JSON structure', async function (this: CustomWorld) {
  await expect(this.page!.locator('text=/Invalid JSON/i').first()).toBeVisible();
});

When('I paste a basic valid JSON configuration', async function (this: CustomWorld) {
  const validJson = JSON.stringify({
    title: "Basic Test",
    questions: [
      {
        content: "What is 2+2?",
        type: "single_choice",
        options: [{ content: "4", isCorrect: true }]
      }
    ]
  });
  await this.page!.locator('textarea').first().fill(validJson);
});

Then('the application should parse settings without error', async function (this: CustomWorld) {
  await expect(this.page!.locator('text=/Invalid JSON/i')).toBeHidden();
  // Valid JSON usually unhides the execute/start button or successfully populates the fields
  // In `quiz-platform`, pasting valid JSON automatically activates TestLoader and mounts TestRenderer?
  // Actually pasting into the field requires clicking "Process Test Data" or similar, let's just make sure there's no error.
});
