// @ts-check
const { test, expect } = require('../../src/fixtures');
const { readJson } = require('../../src/utils/fileHelper');

/** @type {{ cartPair: { name: string }[] }} */
const { cartPair } = readJson('products.json');

test.describe('Offline', { tag: '@regression' }, () => {
  test('Losing the connection fails cleanly and the site recovers once back online', async ({
    page,
    context,
    productsPage,
    homePage,
  }) => {
    await test.step('Open the home page while online', async () => {
      await homePage.open();
      await homePage.expectLoaded();
    });

    await test.step('Go offline: add to cart fails and no popup shows', async () => {
      await context.setOffline(true);
      const failed = page.waitForEvent('requestfailed', (r) => r.url().includes('/add_to_cart/'));
      await homePage.products.clickAddToCart(homePage.products.card(cartPair[0].name));
      await failed;
      await expect(homePage.products.cartModal.title).toBeHidden();
    });

    await test.step('Navigation fails while offline', async () => {
      // Each engine words the network error differently, so we only check that it throws.
      await expect(productsPage.open()).rejects.toThrow();
    });

    await test.step('Back online, the same navigation works', async () => {
      await context.setOffline(false);
      await productsPage.open();
      await productsPage.expectLoaded();
    });
  });
});
