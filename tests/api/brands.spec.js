// @ts-check
const { apiTest: test, expect } = require('../../src/fixtures');
const { API_MESSAGES } = require('../../config/constants');
const { readJson } = require('../../src/utils/fileHelper');

/** @type {{ brands: string[] }} */
const { brands: expectedBrands } = readJson('products.json');

test.describe('Brands API', { tag: '@api' }, () => {
  test('API 03 - Get all brands list', async ({ brandsApi, productCatalog }) => {
    const { status, responseCode, body } = await brandsApi.getAllBrands();

    expect(status).toBe(200);
    expect(responseCode).toBe(200);
    expect(body).toMatchSchema('brandsList');

    // brandsList has one row per product, so brands repeat. Compare the distinct names with the
    // sidebar list we keep in test data.
    const names = [...new Set(body.brands.map((/** @type {{ brand: string }} */ b) => b.brand))];
    expect(names.sort()).toEqual([...expectedBrands].sort());

    // Cross-check against the product catalogue: every brand a product uses must be listed.
    const productBrands = new Set(productCatalog.map((p) => p.brand));
    for (const brand of productBrands) {
      expect.soft(names, `brand "${brand}" used by a product`).toContain(brand);
    }
  });

  test('API 04 - PUT to all brands list is not supported', async ({ brandsApi }) => {
    const { status, responseCode, message, body } = await brandsApi.putToBrandsList();

    expect(status).toBe(200);
    expect(responseCode).toBe(405);
    expect(message).toBe(API_MESSAGES.methodNotSupported);
    expect(body).toMatchSchema('message');
  });
});
