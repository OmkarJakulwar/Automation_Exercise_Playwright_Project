// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { readJson } = require('../../../src/utils/fileHelper');

/** @type {{ brands: string[] }} */
const { brands } = readJson('products.json');

test.describe('Brand products', () => {
  test.beforeEach(async ({ homePage, productsPage }) => {
    await homePage.open();
    await homePage.expectLoaded();
    await homePage.header.goToProducts();
    await productsPage.expectLoaded();
  });

  test(
    'TC19 - View & Cart Brand Products',
    { tag: ['@smoke', '@regression'] },
    async ({ productsPage }) => {
      const [firstBrand, secondBrand] = brands;

      await test.step('Check the brands are visible on the left sidebar', async () => {
        await expect(productsPage.brands.heading).toBeVisible();
        expect(await productsPage.brands.names()).toEqual(expect.arrayContaining(brands));
      });

      await test.step(`Click '${firstBrand}' and check its products are shown`, async () => {
        await productsPage.brands.open(firstBrand);
        await expect(productsPage.grid.title).toHaveText(`Brand - ${firstBrand} Products`);
        await expect(productsPage.grid.cards.first()).toBeVisible();
      });

      await test.step(`Click '${secondBrand}' and check its products are shown`, async () => {
        await productsPage.brands.open(secondBrand);
        await expect(productsPage.grid.title).toHaveText(`Brand - ${secondBrand} Products`);
        await expect(productsPage.grid.cards.first()).toBeVisible();
      });
    },
  );

  // One test per brand: the page should list exactly the products the API puts under it.
  for (const brand of brands) {
    test(
      `TC19 - Brand "${brand}" shows its products`,
      { tag: '@regression' },
      async ({ productsPage, productCatalog }) => {
        const expected = productCatalog
          .filter((p) => p.brand === brand)
          .map((p) => p.name)
          .sort();

        await productsPage.brands.open(brand);

        await expect(productsPage.grid.title).toHaveText(`Brand - ${brand} Products`);
        await expect(productsPage.grid.cards).toHaveCount(expected.length);
        expect((await productsPage.grid.productNames()).sort()).toEqual(expected);
      },
    );
  }
});
