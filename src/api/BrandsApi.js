// @ts-check

/**
 * brandsList (APIs 3 and 4).
 */
class BrandsApi {
  /** @param {import('./ApiClient').ApiClient} client */
  constructor(client) {
    this.client = client;
  }

  /** Lists every brand entry. Brands repeat - it's one row per product, not per brand. */
  getAllBrands() {
    return this.client.get('brandsList');
  }

  /** PUT isn't supported on brandsList - used for the 405 check. */
  putToBrandsList() {
    return this.client.put('brandsList');
  }
}

module.exports = { BrandsApi };
