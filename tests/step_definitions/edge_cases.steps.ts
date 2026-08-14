import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

When('I mock a test configuration with a {int} second time limit', async function (this: CustomWorld, seconds: number) {
  const dummyState = {
    testStore: {
      config: {
        id: "timeout-test",
        title: "Timeout Test",
        questions: [{ id: "q1", content: "Wait for it...", type: "text" }],
        globalTimeLimit: seconds
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
  
  try {
    const startBtn = this.page!.locator('button:has-text("Start Test")').first();
    if (await startBtn.isVisible()) await startBtn.click();
  } catch(e) {}
});

When('I wait for the timer to expire naturally', async function (this: CustomWorld) {
  // Wait a bit past the 5 seconds 
  await this.page!.waitForTimeout(6000);
});

Then('the application should automatically transition to the Results view', async function (this: CustomWorld) {
  // Instead of waiting passively, expect the Results element
  await expect(this.page!.locator('text="Results"').first()).toBeVisible({ timeout: 10000 });
});

When('I mock a test configuration without a time limit', async function (this: CustomWorld) {
  const dummyState = {
    testStore: {
      config: {
        id: "early-submit-test",
        title: "Early Submit Test",
        questions: [{ id: "q1", content: "Do nothing.", type: "text" }],
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
  
  try {
    const startBtn = this.page!.locator('button:has-text("Start Test")').first();
    if (await startBtn.isVisible()) await startBtn.click();
  } catch(e) {}
});

When('I click {string} immediately without answering questions', async function (this: CustomWorld, buttonText: string) {
  await this.page!.locator(`button:has-text("${buttonText}")`).first().click();
});

Then('I should see a warning modal regarding unanswered questions', async function (this: CustomWorld) {
  await expect(this.page!.locator('text=/unanswered/i').first()).toBeVisible({ timeout: 5000 });
});
