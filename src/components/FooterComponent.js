// @ts-check
const { MESSAGES } = require('../../config/constants');

/**
 * Footer with the newsletter subscription box (TC10, TC11).
 */
class FooterComponent {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.root = page.getByRole('contentinfo');
    this.subscriptionHeading = this.root.getByRole('heading', { name: MESSAGES.subscription });
    this.emailInput = this.root.getByPlaceholder('Your email address');
    // The arrow button is icon-only with no accessible name, so the id is the only stable hook.
    this.subscribeButton = this.root.locator('#subscribe');
    this.successMessage = this.root.getByText(MESSAGES.subscribed);
  }

  /** @returns {Promise<void>} */
  async scrollIntoView() {
    await this.subscriptionHeading.scrollIntoViewIfNeeded();
  }

  /**
   * Types an email into the footer box and clicks the arrow.
   * @param {string} email
   * @returns {Promise<void>}
   */
  async subscribe(email) {
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }
}

module.exports = { FooterComponent };
