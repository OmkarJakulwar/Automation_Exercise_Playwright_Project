// @ts-check
const { BasePage } = require('./BasePage');
const { MESSAGES } = require('../../config/constants');

/**
 * @typedef {object} CartItem
 * @property {string} name
 * @property {string} category - e.g. "Women > Tops"
 * @property {string} price - e.g. "Rs. 500"
 * @property {number} quantity
 * @property {string} total - e.g. "Rs. 1000"
 */

class CartPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/view_cart');
    this.breadcrumb = page.getByText('Shopping Cart', { exact: true });
    // The cart is a plain table with no caption or labels, so rows are reached through its id.
    this.rows = page.locator('#cart_info_table tbody tr');
    this.emptyCartMessage = page.getByText(MESSAGES.cartEmpty);
    this.proceedToCheckoutButton = page.getByText('Proceed To Checkout');
    // Shown instead of going to /checkout when nobody is logged in.
    this.checkoutModal = page.locator('#checkoutModal');
    this.registerLoginLink = this.checkoutModal.getByRole('link', { name: 'Register / Login' });
  }

  get marker() {
    return this.breadcrumb;
  }

  /**
   * Table row for a product, matched on the product link in the description cell.
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  row(name) {
    return this.rows.filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  /**
   * Reads every row in the cart.
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

  /**
   * Clicks the X on a product's row and waits for the row to go away.
   * @param {string} name
   * @returns {Promise<void>}
   */
  async removeProduct(name) {
    const row = this.row(name);
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/delete_cart/') && r.ok()),
      row.locator('.cart_quantity_delete').click(),
    ]);
    await row.waitFor({ state: 'detached' });
  }

  /**
   * Clicks "Proceed To Checkout". For a logged-in user this goes to /checkout; for a guest it
   * opens the Register / Login modal, so we don't wait for a URL here.
   * @returns {Promise<void>}
   */
  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }

  /**
   * From the guest checkout modal, follow the Register / Login link.
   * @returns {Promise<void>}
   */
  async goToRegisterLoginFromModal() {
    await this.registerLoginLink.click();
    await this.page.waitForURL('**/login');
  }
}

module.exports = { CartPage };
