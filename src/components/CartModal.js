// @ts-check

/**
 * The "Added!" popup that shows after any "Add to cart" click, on listing and detail pages alike.
 */
class CartModal {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // Bootstrap 3 modal without role="dialog", so getByRole can't see it - the id is what we have.
    this.root = page.locator('#cartModal');
    this.title = this.root.getByRole('heading', { name: 'Added!' });
    this.continueShoppingButton = this.root.getByRole('button', { name: 'Continue Shopping' });
    this.viewCartLink = this.root.getByRole('link', { name: 'View Cart' });
  }

  /**
   * Closes the "Added!" popup and stays on the current page.
   * @returns {Promise<void>}
   */
  async continueShopping() {
    await this.continueShoppingButton.click();
    // The modal fades out; wait for it so the next hover doesn't land on the backdrop.
    await this.root.waitFor({ state: 'hidden' });
  }

  /**
   * Follows the popup's "View Cart" link to /view_cart.
   * @returns {Promise<void>}
   */
  async viewCart() {
    await this.viewCartLink.click();
    await this.page.waitForURL('**/view_cart');
  }
}

module.exports = { CartModal };
