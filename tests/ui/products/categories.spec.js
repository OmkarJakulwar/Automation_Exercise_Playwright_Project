// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { readJson } = require('../../../src/utils/fileHelper');

/** @typedef {{ parent: string, sub: string, heading: string }} Category */
/** @type {{ categories: Category[] }} */
const { categories } = readJson('products.json');

/**
 * Names the API lists under a category, sorted so they can be compared with the grid.
 * @param {import('../../../src/fixtures').CatalogProduct[]} catalog
 * @param {Category} category
 */
const namesIn = (catalog, { parent, sub }) =>
  catalog
    .filter((p) => p.category.usertype.usertype === parent && p.category.category === sub)
    .map((p) => p.name)
    .sort();

test.describe('Category products', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.expectLoaded();
  });

  test(
    'TC18 - View Category Products',
    { tag: ['@smoke', '@regression'] },
    async ({ homePage, productsPage }) => {
      const women = categories.find((c) => c.parent === 'Women');
      const men = categories.find((c) => c.parent === 'Men');
      // eslint-disable-next-line playwright/no-conditional-in-test -- guard so TS knows they're defined
      if (!women || !men) throw new Error('products.json needs a Women and a Men category');

      await test.step('Check the categories are visible on the left sidebar', async () => {
        await expect(homePage.categories.heading).toBeVisible();
        await expect(homePage.categories.root).toBeVisible();
      });

      // The official steps say to click Dress and then expect "WOMEN - TOPS PRODUCTS". That can't
      // both be true; the site shows the heading of whatever you clicked, so that's what we check.
      await test.step(`Click 'Women', then '${women.sub}', and check the category page heading`, async () => {
        await homePage.categories.openSubCategory(women.parent, women.sub);
        await expect(productsPage.grid.title).toHaveText(women.heading);
      });

      await test.step(`Click '${men.sub}' under 'Men' and check we're on that category page`, async () => {
        await productsPage.categories.openSubCategory(men.parent, men.sub);
        await expect(productsPage.grid.title).toHaveText(men.heading);
        await expect(productsPage.grid.cards.first()).toBeVisible();
      });
    },
  );

  // Every sub-category in products.json, checked against what the API says belongs in it.
  for (const category of categories) {
    test(
      `TC18 - Category "${category.parent} > ${category.sub}" shows its products`,
      { tag: '@regression' },
      async ({ homePage, productsPage, productCatalog }) => {
        await homePage.categories.openSubCategory(category.parent, category.sub);

        await expect(productsPage.grid.title).toHaveText(category.heading);
        const expected = namesIn(productCatalog, category);
        await expect(productsPage.grid.cards).toHaveCount(expected.length);
        expect((await productsPage.grid.productNames()).sort()).toEqual(expected);
      },
    );
  }
});
