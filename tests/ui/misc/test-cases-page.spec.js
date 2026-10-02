// @ts-check
const { test, expect } = require('../../../src/fixtures');

test.describe('Test cases page', () => {
  test(
    'TC07 - Verify Test Cases Page',
    { tag: ['@smoke', '@regression'] },
    async ({ homePage, testCasesPage }) => {
      await test.step('Open the home page and check it loaded', async () => {
        await homePage.open();
        await homePage.expectLoaded();
      });

      await test.step("Click 'Test Cases'", async () => {
        await homePage.header.goToTestCases();
      });

      await test.step('Check we are on the test cases page', async () => {
        await testCasesPage.expectLoaded();
        // A heading on its own could survive a broken page, so also check the list rendered.
        await expect(testCasesPage.testCaseLinks.first()).toBeVisible();
      });
    },
  );
});
