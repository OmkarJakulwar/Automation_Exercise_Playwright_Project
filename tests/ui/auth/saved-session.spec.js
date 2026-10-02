// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { AUTH_STATE_FILE } = require('../../../config/constants');

// Not an official case. Shows the login saved by tests/auth.setup.js being reused, so a test can
// start signed in without going through the form. Read-only on purpose: the account is shared
// by every test using this file, so nothing here logs out, deletes or touches the cart.
test.use({ storageState: AUTH_STATE_FILE });

test.describe('Saved login session', () => {
  test(
    'Saved session - user starts logged in and stays logged in across pages',
    { tag: ['@smoke', '@regression'] },
    async ({ homePage, productsPage, cartPage, contactUsPage, authUser }) => {
      const { header } = homePage;

      await test.step('Open the home page and check we are already logged in', async () => {
        await homePage.open();
        await homePage.expectLoaded();
        await expect(header.loggedInAs).toHaveText(`Logged in as ${authUser.name}`);
        await expect(header.logoutLink).toBeVisible();
        await expect(header.deleteAccountLink).toBeVisible();
        await expect(header.signupLoginLink).toBeHidden();
      });

      for (const [label, go, target] of /** @type {const} */ ([
        ['Products', () => header.goToProducts(), productsPage],
        ['Cart', () => header.goToCart(), cartPage],
        ['Contact us', () => header.goToContactUs(), contactUsPage],
      ])) {
        await test.step(`Go to ${label} and check we are still logged in`, async () => {
          await go();
          await target.expectLoaded();
          await expect(header.loggedInAs).toHaveText(`Logged in as ${authUser.name}`);
        });
      }
    },
  );
});
