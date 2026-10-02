// @ts-check
const { test, expect } = require('../../src/fixtures');
const { parsePrice } = require('../../src/utils/price');

test.describe('Product pages match the API', { tag: '@regression' }, () => {
  test('Product detail pages show what productsList returns', async ({
    productDetailPage,
    productCatalog,
  }) => {
    // First, middle and last product: enough to catch a page/API mismatch without opening 34 pages.
    const sample = [0, Math.floor(productCatalog.length / 2), productCatalog.length - 1].map(
      (i) => productCatalog[i],
    );

    for (const product of sample) {
      await test.step(`Product ${product.id}: ${product.name}`, async () => {
        await productDetailPage.openProduct(product.id);
        await productDetailPage.expectLoaded();

        await expect(productDetailPage.name).toHaveText(product.name);
        await expect(productDetailPage.price).toHavePrice(parsePrice(product.price));
        const details = await productDetailPage.details();
        expect(details).toMatchObject({
          brand: product.brand,
          category: `${product.category.usertype.usertype} > ${product.category.category}`,
        });
      });
    }
  });
});
