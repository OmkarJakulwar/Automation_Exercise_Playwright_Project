// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { readCsv } = require('../../../src/utils/fileHelper');

const searchTerms = readCsv('searchTerms.csv');

test.describe('Search products', () => {
  for (const { term } of searchTerms) {
    test(`TC09 - Search Product "${term}"`, { tag: '@regression' }, async ({ homePage, productsPage, productsApi }) => {
      // Search matches on name or category, so "related" can't be checked by looking for the term
      // in each name. The search API runs the same query, so we use it as the expected list.
      const { body } = await productsApi.searchProduct(term);
      const expectedNames = body.products.map((/** @type {{ name: string }} */ p) => p.name).sort();

      await test.step('Open the home page and check it loaded', async () => {
        await homePage.open();
        await homePage.expectLoaded();
      });

      await test.step("Click 'Products' and check 'All Products' is visible", async () => {
        await homePage.header.goToProducts();
        await productsPage.expectLoaded();
      });

      await test.step('Enter the product name and click search', async () => {
        await productsPage.search(term);
      });

      await test.step("Check 'Searched Products' is visible", async () => {
        await expect(productsPage.searchedProductsHeading).toBeVisible();
      });

      await test.step('Check every product related to the search is visible', async () => {
        await expect(productsPage.grid.cards).toHaveCount(expectedNames.length);
        expect((await productsPage.grid.productNames()).sort()).toEqual(expectedNames);
      });
    });
  }
});
