// @ts-check
const fs = require('node:fs');
const { test, expect } = require('../../../src/fixtures');
const { invoiceText, INVOICE_FILE_NAME } = require('../../../config/constants');
const { downloadPath } = require('../../../src/utils/fileHelper');
const {
  EXPECTED_TOTAL,
  addProductsToCart,
  openCart,
  registerThroughUi,
  proceedToCheckout,
  verifyOrderReview,
  placeOrderAndPay,
  deleteAccountThroughUi,
} = require('./steps');

test.describe('Place order', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.expectLoaded();
  });

  test(
    'TC14 - Place Order: Register while Checkout',
    { tag: ['@smoke', '@regression'] },
    async ({
      homePage,
      cartPage,
      checkoutPage,
      paymentPage,
      accountDeletedPage,
      newUser,
      loginSignupPage,
      signupPage,
      accountCreatedPage,
    }) => {
      await addProductsToCart(homePage);
      await openCart(homePage, cartPage);

      await test.step("Click Proceed To Checkout, then 'Register / Login'", async () => {
        await cartPage.proceedToCheckout();
        await expect(cartPage.checkoutModal).toBeVisible();
        await cartPage.goToRegisterLoginFromModal();
      });

      await registerThroughUi({ loginSignupPage, signupPage, accountCreatedPage }, newUser);
      // The guest cart moves over to the new account, so the products are still there.
      await openCart(homePage, cartPage);
      await proceedToCheckout(cartPage, checkoutPage);
      await verifyOrderReview(checkoutPage, newUser);
      await placeOrderAndPay(checkoutPage, paymentPage);
      await deleteAccountThroughUi(accountDeletedPage);
    },
  );

  test(
    'TC15 - Place Order: Register before Checkout',
    { tag: '@regression' },
    async ({
      homePage,
      cartPage,
      checkoutPage,
      paymentPage,
      accountDeletedPage,
      newUser,
      loginSignupPage,
      signupPage,
      accountCreatedPage,
    }) => {
      await test.step("Click 'Signup / Login'", async () => {
        await homePage.header.goToSignupLogin();
      });

      await registerThroughUi({ loginSignupPage, signupPage, accountCreatedPage }, newUser);
      await addProductsToCart(homePage);
      await openCart(homePage, cartPage);
      await proceedToCheckout(cartPage, checkoutPage);
      await verifyOrderReview(checkoutPage, newUser);
      await placeOrderAndPay(checkoutPage, paymentPage);
      await deleteAccountThroughUi(accountDeletedPage);
    },
  );

  test(
    'TC16 - Place Order: Login before Checkout',
    { tag: ['@smoke', '@regression'] },
    async ({
      homePage,
      loginSignupPage,
      cartPage,
      checkoutPage,
      paymentPage,
      accountDeletedPage,
      testUser,
    }) => {
      // Each run gets its own account from the testUser fixture. A shared login would share one
      // cart between parallel tests, because the site stores the cart per account.
      await test.step("Click 'Signup / Login', fill email and password and click Login", async () => {
        await homePage.header.goToSignupLogin();
        await loginSignupPage.loginAndWaitForHome(testUser.email, testUser.password);
      });

      await test.step(`Check 'Logged in as ${testUser.name}' is at the top`, async () => {
        await expect(homePage.header.loggedInAs).toHaveText(`Logged in as ${testUser.name}`);
      });

      await addProductsToCart(homePage);
      await openCart(homePage, cartPage);
      await proceedToCheckout(cartPage, checkoutPage);
      await verifyOrderReview(checkoutPage, testUser);
      await placeOrderAndPay(checkoutPage, paymentPage);
      await deleteAccountThroughUi(accountDeletedPage);
    },
  );

  test(
    'TC24 - Download Invoice after purchase order',
    { tag: '@regression' },
    async (
      {
        homePage,
        cartPage,
        checkoutPage,
        paymentPage,
        accountDeletedPage,
        newUser,
        loginSignupPage,
        signupPage,
        accountCreatedPage,
      },
      testInfo,
    ) => {
      await addProductsToCart(homePage);
      await openCart(homePage, cartPage);

      await test.step("Click Proceed To Checkout, then 'Register / Login'", async () => {
        await cartPage.proceedToCheckout();
        await cartPage.goToRegisterLoginFromModal();
      });

      await registerThroughUi({ loginSignupPage, signupPage, accountCreatedPage }, newUser);
      await openCart(homePage, cartPage);
      await proceedToCheckout(cartPage, checkoutPage);
      await verifyOrderReview(checkoutPage, newUser);
      await placeOrderAndPay(checkoutPage, paymentPage);

      await test.step("Click 'Download Invoice' and check the invoice was downloaded", async () => {
        const savedTo = downloadPath(testInfo, INVOICE_FILE_NAME);
        const download = await paymentPage.downloadInvoice(savedTo);

        expect(download.suggestedFilename()).toBe(INVOICE_FILE_NAME);
        expect(fs.readFileSync(savedTo, 'utf8').trim()).toBe(
          invoiceText(newUser.name, EXPECTED_TOTAL),
        );
        await testInfo.attach(INVOICE_FILE_NAME, {
          path: savedTo,
          contentType: 'text/plain',
        });
      });

      await test.step("Click 'Continue'", async () => {
        await paymentPage.continue();
        await homePage.expectLoaded();
      });

      await deleteAccountThroughUi(accountDeletedPage);
    },
  );
});
