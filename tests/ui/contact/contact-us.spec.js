// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { MESSAGES } = require('../../../config/constants');
const { buildContactMessage } = require('../../../src/utils/dataFactory');
const { testDataPath } = require('../../../src/utils/fileHelper');

test.describe('Contact us', () => {
  test(
    'TC06 - Contact Us Form',
    { tag: ['@smoke', '@regression'] },
    async ({ homePage, contactUsPage }) => {
      const contact = buildContactMessage();

      await test.step('Open the home page and check it loaded', async () => {
        await homePage.open();
        await homePage.expectLoaded();
      });

      await test.step("Click 'Contact Us' and check 'Get In Touch' is visible", async () => {
        await homePage.header.goToContactUs();
        await contactUsPage.expectLoaded();
      });

      await test.step('Enter name, email, subject and message, and upload a file', async () => {
        await contactUsPage.fillForm(contact, testDataPath('upload', 'sample.txt'));
        await expect(contactUsPage.fileInput).toHaveValue(/sample\.txt$/);
      });

      await test.step('Click Submit and accept the confirm dialog', async () => {
        const dialogMessage = await contactUsPage.submit();
        expect(dialogMessage).toBe(MESSAGES.contactConfirm);
      });

      await test.step('Check the success message is visible', async () => {
        await expect(contactUsPage.successMessage).toBeVisible();
      });

      await test.step("Click 'Home' and check we land on the home page", async () => {
        await contactUsPage.goHome();
        await homePage.expectLoaded();
      });
    },
  );
});
