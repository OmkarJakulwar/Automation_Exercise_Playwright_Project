// @ts-check
const { test, expect } = require('../../src/fixtures');
const { readJson, testDataPath } = require('../../src/utils/fileHelper');

/** @type {{ detailCheck: { name: string } }} */
const { detailCheck } = readJson('products.json');

// Recorded with `npm run har:update`, which runs this spec with UPDATE_HAR=1. Only the /products
// document goes in the HAR so the file stays small; scripts, styles and images aren't needed for
// what we check here.
const HAR_FILE = testDataPath('har', 'products.har');
const UPDATE = process.env.UPDATE_HAR === '1';

test.describe('HAR replay', { tag: '@regression' }, () => {
  test('Products page renders from a recorded HAR with the site unreachable', async ({
    page,
    baseURL,
    productsPage,
  }) => {
    if (!UPDATE) {
      // Fail every request to the site, as if it were down. routeFromHAR below is registered
      // later, so it gets first go at each request and only the ones it can't serve end up here.
      const siteHost = new URL(baseURL ?? '').hostname;
      await page.route(
        (url) => url.hostname === siteHost,
        (route) => route.abort('internetdisconnected'),
      );
    }
    await page.routeFromHAR(HAR_FILE, {
      url: '**/products',
      update: UPDATE,
      updateContent: 'embed',
      notFound: 'fallback',
    });

    await productsPage.open();

    await productsPage.expectLoaded();
    await expect(productsPage.grid.cards.first()).toBeVisible();
    await expect(productsPage.grid.card(detailCheck.name)).toBeVisible();
  });
});
