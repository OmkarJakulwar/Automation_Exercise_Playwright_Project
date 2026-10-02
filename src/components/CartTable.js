// @ts-check

/**
 * @typedef {object} CartItem
 * @property {string} name
 * @property {string} category - e.g. "Women > Tops"
 * @property {string} price - e.g. "Rs. 500"
 * @property {number} quantity
 * @property {string} total - e.g. "Rs. 1000"
 */

/**
 * The product table on /view_cart and the "Review Your Order" table on /checkout. Both use the
 * same row markup, so reading rows lives here once.
 */
class CartTable {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} rootSelector - the table wrapper, which only has an id to go on
   */
  constructor(page, rootSelector) {
    this.page = page;
    this.root = page.locator(rootSelector);
    // The checkout table also has a "Total Amount" row; product rows are the ones with an image cell.
    this.rows = this.root.locator('tbody tr').filter({ has: page.locator('.cart_product') });
  }

  /**
   * Row for a product, matched on the product link in the description cell.
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  row(name) {
    return this.rows.filter({
      has: this.page.getByRole('link', { name, exact: true }),
    });
  }

  /**
   * Reads every product row.
   * @returns {Promise<CartItem[]>}
   */
  async items() {
    /** @type {CartItem[]} */
    const items = [];
    for (const row of await this.rows.all()) {
      items.push(await this.readRow(row));
    }
    return items;
  }

  /**
   * @param {import('@playwright/test').Locator} row
   * @returns {Promise<CartItem>}
   */
  async readRow(row) {
    // Cells have no headers or labels linked to them, so the class on each <td> is what we use.
    const text = async (/** @type {string} */ selector) =>
      (await row.locator(selector).innerText()).trim();
    return {
      name: await text('.cart_description h4'),
      category: await text('.cart_description p'),
      price: await text('.cart_price'),
      quantity: Number(await text('.cart_quantity')),
      total: await text('.cart_total'),
    };
  }
}

module.exports = { CartTable };
