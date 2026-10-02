// @ts-check
const { BasePage } = require('./BasePage');

class AccountCreatedPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/account_created');
    this.heading = page.getByTestId('account-created');
    this.continueButton = page.getByTestId('continue-button');
  }

  get marker() {
    return this.heading;
  }

  /**
   * Clicks Continue, which drops you on the home page already logged in.
   * @returns {Promise<void>}
   */
  async continue() {
    await this.continueButton.click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }
}

module.exports = { AccountCreatedPage };
