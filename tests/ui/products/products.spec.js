// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { buildReview } = require('../../../src/utils/dataFactory');
const { readJson } = require('../../../src/utils/fileHelper');

/** @type {{ detailCheck: import('../../../src/pages/ProductDetailPage').ProductDetails & { id: number } }} */
const { detailCheck } = readJson('products.json');

test.describe('All products and product detail', () => {
  test.beforeEach(async ({ homePage, productsPage }) => {
    await homePage.open();
    await homePage.expectLoaded();
    await homePage.header.goToProducts();
    await productsPage.expectLoaded();
  });

  test(
    'TC08 - Verify All Products and product detail page',
    { tag: ['@smoke', '@regression'] },
    async ({ productsPage, productDetailPage, productCatalog }) => {
      await test.step('Check the products list is visible', async () => {
        // The API's product list is the source of truth for how many cards there should be.
        await expect(productsPage.grid.cards).toHaveCount(productCatalog.length);
      });

      await test.step("Click 'View Product' on the first product", async () => {
        await productsPage.grid.viewProduct(0);
        await productDetailPage.expectLoaded();
      });

      await test.step('Check name, category, price, availability, condition and brand', async () => {
        const { id, ...expected } = detailCheck;
        await expect(productDetailPage.page).toHaveURL(new RegExp(`/product_details/${id}$`));
        for (const field of [
          productDetailPage.name,
          productDetailPage.category,
          productDetailPage.price,
          productDetailPage.availability,
          productDetailPage.condition,
          productDetailPage.brand,
        ]) {
          await expect(field).toBeVisible();
        }
        expect(await productDetailPage.details()).toEqual(expected);
      });
    },
  );

  test(
    'TC21 - Add review on product',
    { tag: '@regression' },
    async ({ productsPage, productDetailPage }) => {
      await test.step("Click 'View Product' and check 'Write Your Review' is visible", async () => {
        await productsPage.grid.viewProduct(0);
        await expect(productDetailPage.reviewTab).toBeVisible();
      });

      await test.step('Enter name, email and review, then click Submit', async () => {
        await productDetailPage.writeReview(buildReview());
      });

      await test.step('Check the thank-you message is visible', async () => {
        await expect(productDetailPage.reviewSuccess).toBeVisible();
      });
    },
  );
});
