// @ts-check
const { BasePage } = require('./BasePage');
const { CartTable } = require('../components/CartTable');
const { MESSAGES } = require('../../config/constants');

/** @typedef {import('../components/CartTable').CartItem} CartItem */

class CartPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/view_cart');
    this.breadcrumb = page.getByText('Shopping Cart', { exact: true });
    // The cart is a plain table with no caption or labels, so rows are reached through its id.
    this.table = new CartTable(page, '#cart_info_table');
    this.rows = this.table.rows;
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
   * Table row for a product.
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  row(name) {
    return this.table.row(name);
  }

  /**
   * Reads every row in the cart.
   * @returns {Promise<CartItem[]>}
   */
  async items() {
    return this.table.items();
  }

  /**
   * @param {import('@playwright/test').Locator} row
   * @returns {Promise<CartItem>}
   */
  async readRow(row) {
    return this.table.readRow(row);
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
