// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { HomePage } = require('../../../src/pages/HomePage');
const { LoginSignupPage } = require('../../../src/pages/LoginSignupPage');
const { CartPage } = require('../../../src/pages/CartPage');
const { readJson } = require('../../../src/utils/fileHelper');

/** @type {{ cartPair: { name: string }[] }} */
const { cartPair } = readJson('products.json');

test.describe('Two shoppers at once', { tag: '@regression' }, () => {
  test('Two users in separate browser contexts keep separate carts', async ({
    openContext,
    accountApi,
    testUser,
    newUser,
  }) => {
    // newUser is only data, so register it here; its fixture still deletes it afterwards.
    const created = await accountApi.createAccount(newUser);
    expect(created.responseCode, created.message).toBe(201);

    // Each context is its own cookie jar, like two different people on two different machines.
    const shoppers = await Promise.all(
      [
        { user: testUser, product: cartPair[0].name },
        { user: newUser, product: cartPair[1].name },
      ].map(async ({ user, product }) => {
        const page = await (await openContext()).newPage();
        return {
          user,
          product,
          home: new HomePage(page),
          login: new LoginSignupPage(page),
          cart: new CartPage(page),
        };
      }),
    );

    for (const { user, product, home, login } of shoppers) {
      await test.step(`${user.name} logs in and adds ${product}`, async () => {
        await login.open();
        await login.loginAndWaitForHome(user.email, user.password);
        await expect(home.header.loggedInAs).toHaveText(`Logged in as ${user.name}`);
        await home.products.addProductToCart(product);
      });
    }

    for (const { user, product, cart } of shoppers) {
      await test.step(`${user.name}'s cart holds only ${product}`, async () => {
        await cart.open();
        await expect(cart.rows).toHaveCount(1);
        await expect(cart.row(product)).toBeVisible();
      });
    }
  });
});
