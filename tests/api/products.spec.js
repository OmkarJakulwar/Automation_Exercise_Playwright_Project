// @ts-check
const { apiTest: test, expect } = require('../../src/fixtures');
const { API_MESSAGES } = require('../../config/constants');
const { readCsv, readJson } = require('../../src/utils/fileHelper');

/** @type {{ detailCheck: { id: number, name: string, price: string, brand: string } }} */
const products = readJson('products.json');
const searchTerms = readCsv('searchTerms.csv');

/**
 * Lowercases and strips everything but letters and digits, so "T-Shirt", "T SHIRT" and "Tshirts"
 * all contain "tshirt".
 * @param {string} value
 */
const normalise = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

test.describe('Products API', { tag: '@api' }, () => {
  test('API 01 - Get all products list', { tag: '@smoke' }, async ({ productsApi }) => {
    const { status, responseCode, body } = await productsApi.getAllProducts();

    expect(status).toBe(200);
    expect(responseCode).toBe(200);
    expect(body).toMatchSchema('productsList');
    expect(body.products.length).toBeGreaterThan(0);

    const ids = body.products.map((/** @type {{ id: number }} */ p) => p.id);
    expect(new Set(ids).size, 'product ids should be unique').toBe(ids.length);

    const { id, name, price, brand } = products.detailCheck;
    expect(body.products).toContainEqual(expect.objectContaining({ id, name, price, brand }));
  });

  test('API 02 - POST to all products list is not supported', async ({ productsApi }) => {
    const { status, responseCode, message, body } = await productsApi.postToProductsList();

    // The API answers 200 at the HTTP level and puts the real 405 in the body.
    expect(status).toBe(200);
    expect(responseCode).toBe(405);
    expect(message).toBe(API_MESSAGES.methodNotSupported);
    expect(body).toMatchSchema('message');
  });

  for (const { term, minResults } of searchTerms) {
    test(`API 05 - Search product "${term}"`, async ({ productsApi }) => {
      const { status, responseCode, body } = await productsApi.searchProduct(term);

      expect(status).toBe(200);
      expect(responseCode).toBe(200);
      expect(body).toMatchSchema('productsList');
      expect(body.products.length).toBeGreaterThanOrEqual(Number(minResults));

      // Search matches on name or category, so check each hit against both.
      for (const product of body.products) {
        const haystack = normalise(`${product.name} ${product.category.category}`);
        expect
          .soft(haystack, `"${product.name}" should relate to "${term}"`)
          .toContain(normalise(term));
      }
    });
  }

  test('API 06 - Search product without search_product parameter', async ({ productsApi }) => {
    const { status, responseCode, message, body } = await productsApi.searchProduct();

    expect(status).toBe(200);
    expect(responseCode).toBe(400);
    expect(message).toBe(API_MESSAGES.searchParamMissing);
    expect(body).toMatchSchema('message');
  });
});
