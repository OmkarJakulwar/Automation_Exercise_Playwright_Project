// @ts-check
const { BasePage } = require('./BasePage');

/**
 * @typedef {object} AddressBlock
 * @property {string} fullName - "Mr. First Last"
 * @property {string[]} lines - company, address1, address2 in that order
 * @property {string} cityStatePostcode - "City State Zip" on one line
 * @property {string} country
 * @property {string} phone
 */

class CheckoutPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/checkout');
    this.addressDetailsHeading = page.getByRole('heading', { name: 'Address Details' });
    this.reviewOrderHeading = page.getByRole('heading', { name: 'Review Your Order' });
    // Both address blocks are <ul>s told apart only by id.
    this.deliveryAddress = page.locator('#address_delivery');
    this.billingAddress = page.locator('#address_invoice');
    this.orderRows = page.locator('#cart_info tbody tr').filter({ has: page.locator('.cart_product') });
    this.totalAmount = page
      .locator('#cart_info tbody tr')
      .filter({ hasText: 'Total Amount' })
      .locator('.cart_total_price');
    // The comment box's <label> isn't linked to it, so we scope to its wrapper. A bare
    // getByRole('textbox') also matches the footer's subscription input.
    this.commentBox = page.locator('#ordermsg').getByRole('textbox');
    this.placeOrderButton = page.getByRole('link', { name: 'Place Order' });
  }

  get marker() {
    return this.addressDetailsHeading;
  }

  /**
   * Reads one of the address blocks into a structured object.
   * @param {import('@playwright/test').Locator} block - deliveryAddress or billingAddress
   * @returns {Promise<AddressBlock>}
   */
  async readAddress(block) {
    const text = async (/** @type {string} */ cls) => (await block.locator(cls).innerText()).trim();
    return {
      fullName: await text('.address_firstname'),
      lines: (await block.locator('.address_address1').allInnerTexts()).map((l) => l.trim()),
      cityStatePostcode: await text('.address_city'),
      country: await text('.address_country_name'),
      phone: await text('.address_phone'),
    };
  }

  /**
   * Leaves an order comment and clicks "Place Order".
   * @param {string} comment
   * @returns {Promise<void>}
   */
  async placeOrder(comment) {
    await this.commentBox.fill(comment);
    await this.placeOrderButton.click();
    await this.page.waitForURL('**/payment');
  }
}

module.exports = { CheckoutPage };
