// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { uniqueEmail } = require('../../../src/utils/dataFactory');

test.describe('Footer subscription', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.expectLoaded();
  });

  test(
    'TC10 - Verify Subscription in home page',
    { tag: '@regression' },
    async ({ homePage }) => {
      const { footer } = homePage;

      await test.step("Scroll down to the footer and check 'Subscription' is visible", async () => {
        await homePage.scrollToBottom();
        await expect(footer.subscriptionHeading).toBeInViewport();
      });

      await test.step('Enter an email and click the arrow', async () => {
        await footer.subscribe(uniqueEmail('subscribe'));
      });

      await test.step('Check the success message is visible', async () => {
        await expect(footer.successMessage).toBeVisible();
      });
    },
  );

  test(
    'TC11 - Verify Subscription in Cart page',
    { tag: '@regression' },
    async ({ homePage, cartPage }) => {
      const { footer } = cartPage;

      await test.step("Click 'Cart'", async () => {
        await homePage.header.goToCart();
        await cartPage.expectLoaded();
      });

      await test.step("Scroll down to the footer and check 'Subscription' is visible", async () => {
        await cartPage.scrollToBottom();
        await expect(footer.subscriptionHeading).toBeInViewport();
      });

      await test.step('Enter an email and click the arrow', async () => {
        await footer.subscribe(uniqueEmail('subscribe'));
      });

      await test.step('Check the success message is visible', async () => {
        await expect(footer.successMessage).toBeVisible();
      });
    },
  );
});
