import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

When('I automatically inject a test configuration containing text questions', async function (this: CustomWorld) {
  const dummyState = {
    testStore: {
      config: {
        id: "eval-test-1",
        title: "Evaluation Test",
        questions: [{
          id: "q-text-1",
          content: "Explain dynamic programming.",
          type: "text",
          points: 5
        }],
        globalTimeLimit: null
      },
      status: 'active',
      currentIndex: 0,
      answers: {},
      themeMode: 'light'
    }
  };
  
  await this.page!.goto('http://localhost:5173/upload');
  await this.page!.locator('textarea').first().fill(JSON.stringify(dummyState.testStore.config));
  try {
     const uploadBtn = this.page!.locator('button:has-text("Upload")').first();
     if (await uploadBtn.isVisible()) await uploadBtn.click();
  } catch(e) {}
  
  // Start the test
  try {
    const startBtn = this.page!.locator('button:has-text("Start Test")').first();
    if (await startBtn.isVisible()) await startBtn.click();
  } catch(e) {}
});

When('I enter {string} into the text area for the question', async function (this: CustomWorld, answer: string) {
  await this.page!.locator('textarea[placeholder*="Type your answer"]').first().fill(answer);
});

When('I submit the test requesting AI grading', async function (this: CustomWorld) {
  // First submit test
  await this.page!.locator('button:has-text("Submit Test")').first().click();
  // There is usually a confirm modal
  await this.page!.locator('button:has-text("Submit"), button:has-text("Confirm")').nth(1).click().catch(() => {});
});

When('I intercept the Gemini API to return a predefined evaluation schema', async function (this: CustomWorld) {
  await this.page!.route('**/v1beta/models/*:generateContent*', async (route) => {
    const mockedResponse = {
      candidates: [{
          content: {
            parts: [{
                text: JSON.stringify({
                  evaluations: {
                    "q-text-1": { score: 4, feedback: "Good, but missed memoization context. Mocked Evaluation." }
                  }
                })
              }]
          }
      }]
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockedResponse) });
  });
  
  // Now triggering the grade button. Wait for the page or click grade
  try {
     const gradeBtn = this.page!.locator('button:has-text("Grade with AI")').first();
     if (await gradeBtn.isVisible()) await gradeBtn.click();
  } catch(e) {}
});

Then('the result view should display a score based on the mocked payload', async function (this: CustomWorld) {
  // Wait for score visual update
  await expect(this.page!.locator('text=/4\\s?\\/\\s?5/')).toBeVisible({ timeout: 10000 });
});

Then('the result view should display the mocked feedback', async function (this: CustomWorld) {
  await expect(this.page!.locator('text="Good, but missed memoization context. Mocked Evaluation."').first()).toBeVisible();
});
