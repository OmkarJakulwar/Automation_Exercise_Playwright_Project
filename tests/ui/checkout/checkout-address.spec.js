// @ts-check
const { test } = require('../../../src/fixtures');
const {
  addProductsToCart,
  openCart,
  registerThroughUi,
  proceedToCheckout,
  verifyAddresses,
  deleteAccountThroughUi,
} = require('./steps');

test.describe('Checkout address', () => {
  test(
    'TC23 - Verify address details in checkout page',
    { tag: '@regression' },
    async ({
      homePage,
      cartPage,
      checkoutPage,
      accountDeletedPage,
      newUser,
      loginSignupPage,
      signupPage,
      accountCreatedPage,
    }) => {
      await test.step('Open the home page and check it loaded', async () => {
        await homePage.open();
        await homePage.expectLoaded();
      });

      await test.step("Click 'Signup / Login'", async () => {
        await homePage.header.goToSignupLogin();
      });

      await registerThroughUi({ loginSignupPage, signupPage, accountCreatedPage }, newUser);
      await addProductsToCart(homePage);
      await openCart(homePage, cartPage);
      await proceedToCheckout(cartPage, checkoutPage);
      await verifyAddresses(checkoutPage, newUser);
      await deleteAccountThroughUi(accountDeletedPage);
    },
  );
});
