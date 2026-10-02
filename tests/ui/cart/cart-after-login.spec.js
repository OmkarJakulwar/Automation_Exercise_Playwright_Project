// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { readJson } = require('../../../src/utils/fileHelper');

/** @type {{ searchThenLogin: string }} */
const { searchThenLogin: term } = readJson('products.json');

test.describe('Cart after login', () => {
  test(
    'TC20 - Search Products and Verify Cart After Login',
    { tag: '@regression' },
    async ({ homePage, productsPage, cartPage, loginSignupPage, productsApi, testUser }) => {
      const { body } = await productsApi.searchProduct(term);
      const expectedNames = body.products.map((/** @type {{ name: string }} */ p) => p.name).sort();
      const cartNames = async () => (await cartPage.items()).map((i) => i.name).sort();

      await test.step("Click 'Products' and check 'All Products' is visible", async () => {
        await homePage.open();
        await homePage.header.goToProducts();
        await productsPage.expectLoaded();
      });

      await test.step(`Search for "${term}" and check the related products are visible`, async () => {
        await productsPage.search(term);
        await expect(productsPage.searchedProductsHeading).toBeVisible();
        await expect(productsPage.grid.cards).toHaveCount(expectedNames.length);
        expect((await productsPage.grid.productNames()).sort()).toEqual(expectedNames);
      });

      await test.step('Add all of them to the cart', async () => {
        for (let i = 0; i < expectedNames.length; i++) {
          await productsPage.grid.addProductToCartByIndex(i);
          await productsPage.grid.cartModal.continueShopping();
        }
      });

      await test.step("Click 'Cart' and check the products are there", async () => {
        await productsPage.header.goToCart();
        await expect(cartPage.rows).toHaveCount(expectedNames.length);
        expect(await cartNames()).toEqual(expectedNames);
      });

      await test.step("Click 'Signup / Login' and log in", async () => {
        await cartPage.header.goToSignupLogin();
        await loginSignupPage.login(testUser.email, testUser.password);
        await expect(loginSignupPage.header.loggedInAs).toHaveText(`Logged in as ${testUser.name}`);
      });

      await test.step('Go to the cart again and check the same products are still there', async () => {
        await homePage.header.goToCart();
        await expect(cartPage.rows).toHaveCount(expectedNames.length);
        expect(await cartNames()).toEqual(expectedNames);
      });
    },
  );
});
