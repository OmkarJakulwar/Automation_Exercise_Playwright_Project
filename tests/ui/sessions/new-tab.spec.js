// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { ProductDetailPage } = require('../../../src/pages/ProductDetailPage');
const { readJson } = require('../../../src/utils/fileHelper');

/** @type {{ detailCheck: { id: number, name: string } }} */
const { detailCheck } = readJson('products.json');

test.describe('New tab', { tag: '@regression' }, () => {
  test('Product opened in a new tab shares the cart with the original tab', async ({
    homePage,
    productsPage,
    cartPage,
  }) => {
    await test.step("Open 'Products'", async () => {
      await homePage.open();
      await homePage.header.goToProducts();
      await productsPage.expectLoaded();
    });

    const newTab =
      await test.step('Ctrl/Cmd-click View Product to open it in a new tab', async () => {
        return productsPage.grid.openProductInNewTab(detailCheck.name);
      });

    // Fixtures only build page objects for the first tab, so this one we make ourselves.
    const detailTab = new ProductDetailPage(newTab);

    await test.step('Check the new tab shows the product and the first tab stayed put', async () => {
      await expect(newTab).toHaveURL(new RegExp(`/product_details/${detailCheck.id}$`));
      await expect(detailTab.name).toHaveText(detailCheck.name);
      await productsPage.expectLoaded();
    });

    await test.step('Add the product to the cart from the new tab, then close it', async () => {
      await detailTab.addToCart();
      await newTab.close();
    });

    await test.step('Check the cart in the first tab has the product', async () => {
      // Same browser context, so both tabs share the session cookie and therefore the cart.
      await productsPage.header.goToCart();
      await expect(cartPage.row(detailCheck.name)).toBeVisible();
    });
  });
});
