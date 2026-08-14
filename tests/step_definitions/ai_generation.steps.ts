import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

When('I clear the API key state', async function (this: CustomWorld) {
  await this.page!.evaluate(() => localStorage.removeItem('test-store-storage'));
  await this.page!.reload();
});

When('I mock a valid API key state', async function (this: CustomWorld) {
  await this.page!.evaluate(() => {
    localStorage.setItem('test-store-storage', JSON.stringify({ state: { apiKey: 'AIzaSyMockedValidKeyForTesting123' }, version: 0 }));
  });
  await this.page!.reload();
});

When('I enter {string} into the syllabus textarea', async function (this: CustomWorld, syllabusText: string) {
  // Try finding textarea. If not found instantly, we wait a moment
  await this.page!.locator('textarea').first().fill(syllabusText);
});

When('I intercept the Gemini API to return a predefined test schema', async function (this: CustomWorld) {
  // The Gemini endpoint looks like: https://generativelanguage.googleapis.com/v1beta/models/...
  await this.page!.route('**/v1beta/models/*:generateContent*', async (route) => {
    const mockedResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  title: "React Testing Patterns (Mocked)",
                  description: "A mocked setup for testing",
                  questions: [
                    {
                      content: "What is BDD?",
                      type: "single_choice",
                      options: [
                        { content: "Behavior Driven Development", isCorrect: true },
                        { content: "Bad Dog Design", isCorrect: false }
                      ]
                    }
                  ]
                })
              }
            ]
          }
        }
      ]
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockedResponse)
    });
  });
});

Then('I should see an error indicating the API key is missing', async function (this: CustomWorld) {
  await expect(this.page!.locator('text=/No API key found/i').first()).toBeVisible({ timeout: 5000 });
});

Then('I should see an error indicating the syllabus is missing', async function (this: CustomWorld) {
  await expect(this.page!.locator('text=/Please enter a syllabus/i').first()).toBeVisible({ timeout: 5000 });
});

Then('the application should route to the Test Loader setup', async function (this: CustomWorld) {
  // Test Loader shows up with buttons like "Start Test" or Title Headers
  await expect(this.page!.locator('button:has-text("Start Test")').first()).toBeVisible({ timeout: 10000 });
});

Then('the generated title should be rendered', async function (this: CustomWorld) {
  await expect(this.page!.locator('text="React Testing Patterns (Mocked)"').first()).toBeVisible();
});
