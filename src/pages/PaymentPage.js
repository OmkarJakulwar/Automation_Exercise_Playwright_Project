// @ts-check
const { BasePage } = require('./BasePage');
const { MESSAGES } = require('../../config/constants');

/**
 * /payment and the /payment_done/<id> page it leads to. The "done" page only has a heading and
 * two buttons, so it lives here rather than in its own class.
 */
class PaymentPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/payment');
    this.heading = page.getByRole('heading', { name: 'Payment', exact: true });
    this.nameOnCard = page.getByTestId('name-on-card');
    this.cardNumber = page.getByTestId('card-number');
    this.cvc = page.getByTestId('cvc');
    this.expiryMonth = page.getByTestId('expiry-month');
    this.expiryYear = page.getByTestId('expiry-year');
    this.payButton = page.getByTestId('pay-button');

    this.orderPlacedHeading = page.getByTestId('order-placed');
    this.orderConfirmedText = page.getByText(MESSAGES.orderConfirmed);
    this.downloadInvoiceButton = page.getByRole('link', { name: 'Download Invoice' });
    this.continueButton = page.getByTestId('continue-button');
  }

  get marker() {
    return this.heading;
  }

  /**
   * Fills the card form and clicks "Pay and Confirm Order".
   *
   * NOTE: the official test case says to check for "Your order has been placed successfully!",
   * but on the live site that alert stays hidden and the form posts straight through to
   * /payment_done/<id>. We wait for that page instead and check its "Order Placed!" heading.
   * @param {import('../utils/dataFactory').PaymentCard} card
   * @returns {Promise<void>}
   */
  async payAndConfirm(card) {
    await this.nameOnCard.fill(card.nameOnCard);
    await this.cardNumber.fill(card.cardNumber);
    await this.cvc.fill(card.cvc);
    await this.expiryMonth.fill(card.expiryMonth);
    await this.expiryYear.fill(card.expiryYear);
    await this.payButton.click();
    await this.page.waitForURL('**/payment_done/**');
  }

  /**
   * Clicks "Download Invoice" and saves the file.
   * @param {string} savePath - where to put the file
   * @returns {Promise<import('@playwright/test').Download>}
   */
  async downloadInvoice(savePath) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadInvoiceButton.click(),
    ]);
    await download.saveAs(savePath);
    return download;
  }

  /** @returns {Promise<void>} */
  async continue() {
    await this.continueButton.click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }
}

module.exports = { PaymentPage };
