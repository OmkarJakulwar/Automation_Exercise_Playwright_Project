// @ts-check

/**
 * productsList and searchProduct (APIs 1, 2, 5 and 6).
 */
class ProductsApi {
  /** @param {import('./ApiClient').ApiClient} client */
  constructor(client) {
    this.client = client;
  }

  /** Lists every product. */
  getAllProducts() {
    return this.client.get('productsList');
  }

  /** POST isn't supported on productsList - used for the 405 check. */
  postToProductsList() {
    return this.client.post('productsList');
  }

  /**
   * Searches products by name or category.
   * @param {string} [term] - leave it out to send the request with no search_product at all
   */
  searchProduct(term) {
    return this.client.post(
      'searchProduct',
      term === undefined ? {} : { form: { search_product: term } },
    );
  }
}

module.exports = { ProductsApi };
