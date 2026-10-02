// @ts-check
const { CartModal } = require('./CartModal');

/**
 * @typedef {object} ProductCardInfo
 * @property {string} name
 * @property {string} price - as shown, e.g. "Rs. 500"
 */

/** @typedef {ProductCardInfo & { id: number }} AddedProduct */

/**
 * A grid of product cards. The home page, products page, category/brand pages and search results
 * all use the same markup, and so does the "recommended items" carousel, so one component
 * covers all of them - pass the container selector for the one you want.
 */
class ProductGrid {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} [rootSelector] - container around the cards
   */
  constructor(page, rootSelector = '.features_items') {
    this.page = page;
    // The cards are plain divs with no roles or test ids, so CSS classes are all we can use here.
    this.root = page.locator(rootSelector);
    this.title = this.root.getByRole('heading', { level: 2 }).first();
    this.cards = this.root.locator('.product-image-wrapper');
    this.cartModal = new CartModal(page);
  }

  /**
   * Card for a product, matched on its exact name.
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  card(name) {
    return this.cards.filter({
      has: this.page.locator('.productinfo').getByText(name, { exact: true }),
    });
  }

  /**
   * The price shown on a product's card.
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  price(name) {
    return this.card(name).locator('.productinfo').getByRole('heading');
  }

  /**
   * Walks every card and reads its name and price. Only cards that are actually rendered
   * count - the recommended carousel keeps hidden slides in the DOM.
   * @returns {Promise<ProductCardInfo[]>}
   */
  async products() {
    /** @type {ProductCardInfo[]} */
    const result = [];
    for (const card of await this.cards.all()) {
      const info = card.locator('.productinfo');
      if (!(await info.isVisible())) continue;
      result.push({
        name: (await info.locator('p').innerText()).trim(),
        price: (await info.getByRole('heading').innerText()).trim(),
      });
    }
    return result;
  }

  /**
   * @returns {Promise<string[]>}
   */
  async productNames() {
    return (await this.products()).map((p) => p.name);
  }

  /**
   * Hovers a card and clicks its "Add to cart" button, without waiting for anything after.
   * Most tests want addCardToCart(); this is for the ones that mock the request to fail.
   * @param {import('@playwright/test').Locator} card
   * @returns {Promise<void>}
   */
  async clickAddToCart(card) {
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    // The hover overlay only exists on listing grids; the recommended carousel has no overlay,
    // so fall back to the button inside the card itself.
    const overlayButton = card.locator('.product-overlay').getByText('Add to cart');
    const button =
      (await overlayButton.count()) > 0 ? overlayButton : card.getByText('Add to cart');
    await button.click();
  }

  /**
   * Hovers a card and clicks the "Add to cart" button in its overlay, then waits for the
   * "Added!" popup. We wait on the add_to_cart request too, because the popup can show up
   * a moment before the server has stored the item.
   * @param {import('@playwright/test').Locator} card
   * @returns {Promise<void>}
   */
  async addCardToCart(card) {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/add_to_cart/') && r.ok()),
      this.clickAddToCart(card),
    ]);
    await this.cartModal.title.waitFor({ state: 'visible' });
  }

  /**
   * Touch version of adding to cart. Phones have no hover, so we tap the button in the card
   * body rather than the one in the hover overlay.
   * @param {string} name
   * @returns {Promise<void>}
   */
  async tapAddToCart(name) {
    const button = this.card(name).locator('.productinfo').getByText('Add to cart');
    await button.scrollIntoViewIfNeeded();
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/add_to_cart/') && r.ok()),
      button.tap(),
    ]);
    await this.cartModal.title.waitFor({ state: 'visible' });
  }

  /**
   * Adds the product with this name to the cart.
   * @param {string} name
   * @returns {Promise<void>}
   */
  async addProductToCart(name) {
    await this.addCardToCart(this.card(name));
  }

  /**
   * Adds the n-th visible product (0-based) to the cart and returns what was added.
   * @param {number} index
   * @returns {Promise<ProductCardInfo>}
   */
  async addProductToCartByIndex(index) {
    const card = this.cards.nth(index);
    const info = card.locator('.productinfo');
    const product = {
      name: (await info.locator('p').innerText()).trim(),
      price: (await info.getByRole('heading').innerText()).trim(),
    };
    await this.addCardToCart(card);
    return product;
  }

  /**
   * Adds whichever product is showing first right now. Meant for the recommended carousel, which
   * rotates by itself: Bootstrap pauses it while the mouse is over it, so we hover the carousel
   * before picking a card, otherwise the card can slide away between finding it and clicking.
   * The id comes back too because the carousel prints the price where the name should be for
   * at least one product, so the card's text can't be trusted to find the item in the cart.
   * @returns {Promise<AddedProduct>}
   */
  async addFirstVisibleProductToCart() {
    await this.root.scrollIntoViewIfNeeded();
    await this.root.hover();
    const card = this.cards.filter({ visible: true }).first();
    const info = card.locator('.productinfo');
    const product = {
      id: Number(await card.locator('[data-product-id]').getAttribute('data-product-id')),
      name: (await info.locator('p').innerText()).trim(),
      price: (await info.getByRole('heading').innerText()).trim(),
    };
    await this.addCardToCart(card);
    return product;
  }

  /**
   * Clicks "View Product" on a card.
   * @param {string | number} nameOrIndex - product name, or 0-based position in the grid
   * @returns {Promise<void>}
   */
  async viewProduct(nameOrIndex) {
    const card =
      typeof nameOrIndex === 'number' ? this.cards.nth(nameOrIndex) : this.card(nameOrIndex);
    await card.getByRole('link', { name: 'View Product' }).click();
    await this.page.waitForURL('**/product_details/**');
  }

  /**
   * Ctrl/Cmd-clicks "View Product" so the detail page opens in a new tab, like a shopper
   * comparing products would. The current page stays where it is.
   * @param {string} name
   * @returns {Promise<import('@playwright/test').Page>} the new tab, loaded
   */
  async openProductInNewTab(name) {
    const link = this.card(name).getByRole('link', { name: 'View Product' });
    const [newTab] = await Promise.all([
      this.page.context().waitForEvent('page'),
      link.click({ modifiers: ['ControlOrMeta'] }),
    ]);
    // Not waitForLoadState: the new tab starts on about:blank, which counts as already loaded,
    // so that returns before the product page has even started. Wait for the real URL instead.
    await newTab.waitForURL('**/product_details/**');
    return newTab;
  }
}

module.exports = { ProductGrid };
