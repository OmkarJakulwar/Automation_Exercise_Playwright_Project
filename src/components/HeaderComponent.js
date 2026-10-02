// @ts-check

/**
 * Top navigation bar. It's on every page, so BasePage creates one and all pages share it.
 */
class HeaderComponent {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // <header> is the page's banner landmark, so we can scope every link to it and never clash
    // with the "Test Cases" / "Home" buttons elsewhere on the page.
    this.root = page.getByRole('banner');
    this.logo = this.root.getByAltText('Website for automation practice');
    this.homeLink = this.root.getByRole('link', { name: 'Home' });
    this.productsLink = this.root.getByRole('link', { name: 'Products' });
    this.cartLink = this.root.getByRole('link', { name: 'Cart' });
    this.signupLoginLink = this.root.getByRole('link', { name: 'Signup / Login' });
    this.logoutLink = this.root.getByRole('link', { name: 'Logout' });
    this.deleteAccountLink = this.root.getByRole('link', { name: 'Delete Account' });
    this.testCasesLink = this.root.getByRole('link', { name: 'Test Cases' });
    this.apiTestingLink = this.root.getByRole('link', { name: 'API Testing' });
    this.contactUsLink = this.root.getByRole('link', { name: 'Contact us' });
    this.loggedInAs = this.root.getByText(/Logged in as/);
  }

  /**
   * Clicks a nav link and waits for the target page to fully load. Waiting for "load" (which
   * waitForURL does by default) matters here: several pages wire up their buttons with jQuery
   * on load, and a click that lands before that silently does nothing.
   * @param {import('@playwright/test').Locator} link
   * @param {string | RegExp | ((url: URL) => boolean)} url
   * @returns {Promise<void>}
   */
  async navigate(link, url) {
    await link.click();
    await this.page.waitForURL(url);
  }

  /** @returns {Promise<void>} */
  async goHome() {
    await this.navigate(this.homeLink, (url) => url.pathname === '/');
  }

  /** @returns {Promise<void>} */
  async goToProducts() {
    await this.navigate(this.productsLink, '**/products');
  }

  /** @returns {Promise<void>} */
  async goToCart() {
    await this.navigate(this.cartLink, '**/view_cart');
  }

  /** @returns {Promise<void>} */
  async goToSignupLogin() {
    await this.navigate(this.signupLoginLink, '**/login');
  }

  /** @returns {Promise<void>} */
  async goToTestCases() {
    await this.navigate(this.testCasesLink, '**/test_cases');
  }

  /** @returns {Promise<void>} */
  async goToContactUs() {
    await this.navigate(this.contactUsLink, '**/contact_us');
  }

  /** @returns {Promise<void>} */
  async logout() {
    await this.navigate(this.logoutLink, '**/login');
  }

  /** @returns {Promise<void>} */
  async deleteAccount() {
    await this.navigate(this.deleteAccountLink, '**/delete_account');
  }

  /**
   * Reads the name out of "Logged in as <name>".
   * @returns {Promise<string>}
   */
  async loggedInUserName() {
    const text = await this.loggedInAs.innerText();
    return text.replace('Logged in as', '').trim();
  }
}

module.exports = { HeaderComponent };
