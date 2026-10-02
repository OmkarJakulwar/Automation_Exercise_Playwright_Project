// @ts-check
const fs = require('node:fs');
const path = require('node:path');
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
   * @returns {Promise<{ fileName: string }>} the file name the server suggested
   */
  async downloadInvoice(savePath) {
    const response = this.page.waitForResponse((r) => r.url().includes('/download_invoice/'));
    const download = this.page.waitForEvent('download');
    // WebKit on Linux ignores `Content-Disposition: attachment` for text/plain and shows the
    // invoice as a page, so no download event ever fires there. Elsewhere the download wins the
    // race. Some engines also cancel the navigation when the download starts, which fails the URL
    // wait - in that case we just keep waiting for the download.
    const shownInline = this.page.waitForURL('**/download_invoice/**').then(
      () => null,
      () => download,
    );
    await this.downloadInvoiceButton.click();

    const file = await Promise.race([download, shownInline]);
    if (file) {
      await file.saveAs(savePath);
      return { fileName: file.suggestedFilename() };
    }
    // Never coming now; stop it turning into an unhandled rejection when it times out.
    download.catch(() => {});
    const res = await response;
    const disposition = (await res.headerValue('content-disposition')) ?? '';
    fs.mkdirSync(path.dirname(savePath), { recursive: true });
    fs.writeFileSync(savePath, await res.text());
    // The invoice replaced the order page, so go back to it like a user would - the next step
    // in TC24 clicks "Continue" there.
    await this.page.goBack();
    await this.page.waitForURL('**/payment_done/**');
    return { fileName: disposition.match(/filename="?([^";]+)"?/)?.[1] ?? '' };
  }

  /**
   * Clicks "Continue" on the order-placed page and waits for the home page.
   * @returns {Promise<void>}
   */
  async continue() {
    await this.continueButton.click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }
}

module.exports = { PaymentPage };
