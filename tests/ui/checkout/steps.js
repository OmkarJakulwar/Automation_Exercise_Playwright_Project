// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { MESSAGES } = require('../../../config/constants');
const { readJson } = require('../../../src/utils/fileHelper');
const { formatPrice } = require('../../../src/utils/price');
const {
  toAddressBlock,
  buildOrderComment,
  buildPaymentCard,
} = require('../../../src/utils/dataFactory');

// Steps the checkout cases (TC14, 15, 16, 23, 24) share. They go through test.step so the report
// reads the same as an inline step would. Not a spec file, so Playwright doesn't run it directly.

/** @typedef {import('../../../src/utils/dataFactory').User} User */
/** @typedef {import('../../../src/components/CartTable').CartItem} CartItem */

/** @type {{ cartPair: { id: number, name: string, price: number }[] }} */
const { cartPair } = readJson('products.json');

/**
 * What the cart / order review should hold after addProductsToCart().
 * @type {Pick<CartItem, 'name' | 'price' | 'quantity' | 'total'>[]}
 */
const EXPECTED_ITEMS = cartPair.map(({ name, price }) => ({
  name,
  price: formatPrice(price),
  quantity: 1,
  total: formatPrice(price),
}));
const EXPECTED_TOTAL = cartPair.reduce((sum, p) => sum + p.price, 0);

/**
 * Adds the products from products.json → cartPair to the cart from the home page grid.
 * @param {import('../../../src/pages/HomePage').HomePage} homePage
 */
async function addProductsToCart(homePage) {
  await test.step('Add products to cart', async () => {
    for (const { name } of cartPair) {
      await homePage.products.addProductToCart(name);
      await homePage.products.cartModal.continueShopping();
    }
  });
}

/**
 * Goes to the cart through the header and checks it holds the expected products.
 * @param {import('../../../src/pages/HomePage').HomePage} homePage
 * @param {import('../../../src/pages/CartPage').CartPage} cartPage
 */
async function openCart(homePage, cartPage) {
  await test.step("Click 'Cart' and check the cart page is shown", async () => {
    await homePage.header.goToCart();
    await cartPage.expectLoaded();
    await expect(cartPage.rows).toHaveCount(EXPECTED_ITEMS.length);
  });
}

/**
 * Fills the second signup page and creates the account, starting from /login.
 * @param {{ loginSignupPage: import('../../../src/pages/LoginSignupPage').LoginSignupPage,
 *   signupPage: import('../../../src/pages/SignupPage').SignupPage,
 *   accountCreatedPage: import('../../../src/pages/AccountCreatedPage').AccountCreatedPage }} pages
 * @param {User} user
 */
async function registerThroughUi({ loginSignupPage, signupPage, accountCreatedPage }, user) {
  await test.step('Fill all details in Signup and create the account', async () => {
    await loginSignupPage.startSignup(user.name, user.email);
    await signupPage.expectLoaded();
    await signupPage.createAccount(user);
  });

  await test.step("Check 'Account Created!' and click Continue", async () => {
    await expect(accountCreatedPage.heading).toHaveText(MESSAGES.accountCreated, {
      ignoreCase: true,
    });
    await accountCreatedPage.continue();
  });

  await test.step(`Check 'Logged in as ${user.name}' is at the top`, async () => {
    await expect(accountCreatedPage.header.loggedInAs).toHaveText(`Logged in as ${user.name}`);
  });
}

/**
 * Clicks "Proceed To Checkout" as a logged-in user and waits for /checkout.
 * @param {import('../../../src/pages/CartPage').CartPage} cartPage
 * @param {import('../../../src/pages/CheckoutPage').CheckoutPage} checkoutPage
 */
async function proceedToCheckout(cartPage, checkoutPage) {
  await test.step('Click Proceed To Checkout', async () => {
    await cartPage.proceedToCheckout();
    await checkoutPage.expectLoaded();
  });
}

/**
 * Checks both address blocks match what the user registered with.
 * @param {import('../../../src/pages/CheckoutPage').CheckoutPage} checkoutPage
 * @param {User} user
 */
async function verifyAddresses(checkoutPage, user) {
  const expected = toAddressBlock(user);

  await test.step('Check the delivery address matches the one used at registration', async () => {
    expect(await checkoutPage.readAddress(checkoutPage.deliveryAddress)).toEqual(expected);
  });

  await test.step('Check the billing address matches the one used at registration', async () => {
    expect(await checkoutPage.readAddress(checkoutPage.billingAddress)).toEqual(expected);
  });
}

/**
 * "Verify Address Details and Review Your Order".
 * @param {import('../../../src/pages/CheckoutPage').CheckoutPage} checkoutPage
 * @param {User} user
 */
async function verifyOrderReview(checkoutPage, user) {
  await verifyAddresses(checkoutPage, user);

  await test.step('Check the order review lists the products and the right total', async () => {
    await expect(checkoutPage.reviewOrderHeading).toBeVisible();
    const items = await checkoutPage.order.items();
    expect(items).toEqual(EXPECTED_ITEMS.map((item) => expect.objectContaining(item)));
    await expect(checkoutPage.totalAmount).toHaveText(formatPrice(EXPECTED_TOTAL));
  });
}

/**
 * Comment → Place Order → card details → Pay and Confirm, then checks the confirmation page.
 * @param {import('../../../src/pages/CheckoutPage').CheckoutPage} checkoutPage
 * @param {import('../../../src/pages/PaymentPage').PaymentPage} paymentPage
 */
async function placeOrderAndPay(checkoutPage, paymentPage) {
  await test.step("Enter a comment and click 'Place Order'", async () => {
    await checkoutPage.placeOrder(buildOrderComment());
    await paymentPage.expectLoaded();
  });

  await test.step("Enter card details and click 'Pay and Confirm Order'", async () => {
    await paymentPage.payAndConfirm(buildPaymentCard());
  });

  // The official text checks for "Your order has been placed successfully!", which the live site
  // never shows - see PaymentPage.payAndConfirm. The confirmation page is what we can check.
  await test.step('Check the order was placed', async () => {
    await expect(paymentPage.orderPlacedHeading).toHaveText(MESSAGES.orderPlaced, {
      ignoreCase: true,
    });
    await expect(paymentPage.orderConfirmedText).toBeVisible();
  });
}

/**
 * Deletes the logged-in account through the header link and checks the confirmation.
 * @param {import('../../../src/pages/AccountDeletedPage').AccountDeletedPage} accountDeletedPage
 */
async function deleteAccountThroughUi(accountDeletedPage) {
  await test.step("Click 'Delete Account', check 'Account Deleted!' and click Continue", async () => {
    await accountDeletedPage.header.deleteAccount();
    await expect(accountDeletedPage.heading).toHaveText(MESSAGES.accountDeleted, {
      ignoreCase: true,
    });
    await accountDeletedPage.continue();
  });
}

module.exports = {
  EXPECTED_TOTAL,
  addProductsToCart,
  openCart,
  registerThroughUi,
  proceedToCheckout,
  verifyAddresses,
  verifyOrderReview,
  placeOrderAndPay,
  deleteAccountThroughUi,
};
