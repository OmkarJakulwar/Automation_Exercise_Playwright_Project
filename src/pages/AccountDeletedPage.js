// @ts-check
const { BasePage } = require('./BasePage');

class AccountDeletedPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/delete_account');
    this.heading = page.getByTestId('account-deleted');
    this.continueButton = page.getByTestId('continue-button');
  }

  get marker() {
    return this.heading;
  }

  /** @returns {Promise<void>} */
  async continue() {
    await this.continueButton.click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }
}

module.exports = { AccountDeletedPage };
