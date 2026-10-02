// @ts-check
const { test, expect } = require('../../src/fixtures');
const { readJson } = require('../../src/utils/fileHelper');

/** @type {{ cartPair: { id: number, name: string }[] }} */
const { cartPair } = readJson('products.json');

// Baselines are per OS (the file names end in -darwin / -linux), because fonts render a little
// differently on each. Refresh them with `npm run update:snapshots`, or the :docker variant for
// the Linux ones CI compares against.
test.describe('Visual', { tag: '@visual' }, () => {
  // Real product pictures: a grey 1x1 placeholder would hide a broken image.
  test.use({ stubProductImages: false });

  test('Home page', async ({ homePage }) => {
    // With real images the home page holds its load event back 10-25s (see the productImages
    // fixture), so give it more room than a normal test.
    test.slow();
    await homePage.open();
    await homePage.expectLoaded();

    // Only the first screen: the full page is 8000+px of product cards that reflow whenever the
    // catalogue changes. The carousel rotates on its own, so its slide would differ every run.
    await expect(homePage.page).toHaveScreenshot('home.png', { mask: [homePage.carousel] });
  });

  test('Product detail', async ({ productDetailPage }) => {
    await productDetailPage.openProduct(cartPair[0].id);
    await productDetailPage.expectLoaded();

    await expect(productDetailPage.panel).toHaveScreenshot('product-detail.png');
  });

  test('Cart with two products', async ({ productDetailPage, cartPage }) => {
    // A guest cart lives in the browser session, so this doesn't need an account.
    for (const { id } of cartPair) {
      await productDetailPage.openProduct(id);
      await productDetailPage.addToCart();
    }
    await productDetailPage.cartModal.viewCart();
    await cartPage.expectLoaded();
    await expect(cartPage.rows).toHaveCount(cartPair.length);

    await expect(cartPage.table.root).toHaveScreenshot('cart.png');
  });
});
