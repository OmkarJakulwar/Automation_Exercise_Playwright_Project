// @ts-check
const { test, expect } = require('../../src/fixtures');
const { readJson, readCsv } = require('../../src/utils/fileHelper');

/** @type {{ cartPair: { id: number, name: string, price: number }[] }} */
const { cartPair } = readJson('products.json');
const [patched, untouched] = cartPair;
const searchTerms = readCsv('searchTerms.csv').map((row) => row.term);

// A price no real product has, so it can only come from our patch.
const MOCK_PRICE = 1;

/**
 * True for the add-to-cart AJAX call the listing and detail pages make.
 * @param {URL} url
 */
const isAddToCart = (url) => url.pathname.startsWith('/add_to_cart/');

test.describe('Network mocking', { tag: '@regression' }, () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.open();
    await productsPage.expectLoaded();
  });

  test('fulfill: a failing add-to-cart call shows no "Added!" popup and adds nothing', async ({
    page,
    productsPage,
    cartPage,
  }) => {
    const { grid } = productsPage;
    // Answer the AJAX call ourselves with a 500, so the server never sees it.
    await page.route(isAddToCart, (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' }),
    );

    const response = page.waitForResponse((r) => isAddToCart(new URL(r.url())));
    await grid.clickAddToCart(grid.card(patched.name));
    expect((await response).status()).toBe(500);

    // The site only opens the popup from the success callback, so by the time the 500 has come
    // back it would already be showing if it was going to.
    await expect(grid.cartModal.title).toBeHidden();
    await productsPage.header.goToCart();
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });

  test('fetch + fulfill: patch a price in the real page before the browser sees it', async ({
    page,
    productsPage,
  }) => {
    // Fetch the real page, change one product's price in the HTML, and hand the result over.
    // Handy for checking how the UI copes with data that's awkward to set up for real.
    await page.route('**/products', async (route) => {
      // Firefox asks for zstd, which route.fetch() hands back still compressed. Asking for the
      // encodings Playwright decodes keeps the HTML readable in every engine.
      const response = await route.fetch({
        headers: { ...route.request().headers(), 'accept-encoding': 'gzip, deflate, br' },
      });
      const html = await response.text();
      const pattern = new RegExp(`(<h2>)Rs\\. ${patched.price}(</h2>\\s*<p>${patched.name}</p>)`);
      expect(html, 'the price/name markup we patch should still exist').toMatch(pattern);
      await route.fulfill({ response, body: html.replace(pattern, `$1Rs. ${MOCK_PRICE}$2`) });
    });

    await page.reload();

    await expect(productsPage.grid.price(patched.name)).toHavePrice(MOCK_PRICE);
    await expect(productsPage.grid.price(untouched.name)).toHavePrice(untouched.price);
  });

  test('continue: rewrite the search term on its way to the server', async ({
    page,
    productsPage,
    productsApi,
  }) => {
    const typed = searchTerms[0];
    const sent = searchTerms[searchTerms.length - 1];
    const { body } = await productsApi.searchProduct(sent);
    const expectedNames = body.products.map((/** @type {{ name: string }} */ p) => p.name).sort();

    // The request still goes to the real server, just with a different query string.
    /** @type {string | null} */
    let requested = null;
    await page.route(
      (url) => url.pathname === '/products' && url.searchParams.has('search'),
      (route) => {
        const url = new URL(route.request().url());
        requested = url.searchParams.get('search');
        url.searchParams.set('search', sent);
        return route.continue({ url: url.toString() });
      },
    );

    await productsPage.search(typed);

    // The browser asked for what the user typed; the server answered for the rewritten term.
    // (page.url() isn't a reliable check: Chromium keeps the original, Firefox shows the new one.)
    expect(requested).toBe(typed);
    await expect(productsPage.grid.cards).toHaveCount(expectedNames.length);
    expect((await productsPage.grid.productNames()).sort()).toEqual(expectedNames);
  });

  test.describe('abort', () => {
    // We want real image requests here so there's something to abort.
    test.use({ stubProductImages: false });

    test('abort: the shop still works with images and fonts blocked', async ({
      page,
      productsPage,
      productCatalog,
    }) => {
      let aborted = 0;
      await page.route(
        () => true,
        (route) => {
          if (['image', 'font', 'media'].includes(route.request().resourceType())) {
            aborted += 1;
            return route.abort();
          }
          return route.fallback();
        },
      );

      await page.reload();

      expect(aborted).toBeGreaterThan(0);
      await expect(productsPage.grid.cards).toHaveCount(productCatalog.length);
      await productsPage.grid.addProductToCart(patched.name);
      await expect(productsPage.grid.cartModal.title).toBeVisible();
    });
  });

  test('inspect: add-to-cart from the detail page sends the chosen quantity', async ({
    page,
    productsPage,
    productDetailPage,
  }) => {
    const quantity = 3;
    await productsPage.grid.viewProduct(patched.name);
    await productDetailPage.setQuantity(quantity);

    const request = page.waitForRequest((r) => isAddToCart(new URL(r.url())));
    await productDetailPage.addToCart();
    const url = new URL((await request).url());

    expect(url.pathname).toBe(`/add_to_cart/${patched.id}`);
    expect(url.searchParams.get('quantity')).toBe(String(quantity));
  });
});
