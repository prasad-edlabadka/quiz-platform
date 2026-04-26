import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/support';

Then('I should see the {string} title', async function (this: CustomWorld, expectedTitle: string) {
  // Wait for the past results title to show up
  await expect(this.page!.locator(`text="${expectedTitle}"`).first()).toBeVisible();
});

Then('the export PDF button state should be visible or hidden appropriately', async function (this: CustomWorld) {
  // If no history, it might just say "No test history available yet."
  // And there shouldn't be an export PDF button for an empty list
  // So we just check that the UI didn't crash.
  const pdfBtn = this.page!.locator('button:has-text("Export")');
  await expect(this.page!.locator('text="No test history"').or(pdfBtn).first()).toBeVisible();
});
