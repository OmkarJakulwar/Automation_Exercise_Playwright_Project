// @ts-check
const { BasePage } = require('./BasePage');
const { CartModal } = require('../components/CartModal');
const { MESSAGES } = require('../../config/constants');

/**
 * @typedef {object} ProductDetails
 * @property {string} name
 * @property {string} category - e.g. "Women > Tops"
 * @property {string} price - e.g. "Rs. 500"
 * @property {string} availability
 * @property {string} condition
 * @property {string} brand
 */

class ProductDetailPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {number} [productId] - only needed if you call open()
   */
  constructor(page, productId = 1) {
    super(page, `/product_details/${productId}`);
    this.cartModal = new CartModal(page);

    // The image + info block and the info panel are plain divs; their classes are all we have.
    this.panel = page.locator('.product-details');
    this.info = this.panel.locator('.product-information');
    this.name = this.info.getByRole('heading', { level: 2 });
    this.category = this.info.getByText(/^Category:/);
    this.price = this.info.getByText(/^Rs\. \d+$/);
    this.availability = this.info.locator('p').filter({ hasText: 'Availability:' });
    this.condition = this.info.locator('p').filter({ hasText: 'Condition:' });
    this.brand = this.info.locator('p').filter({ hasText: 'Brand:' });
    // The "Quantity:" label isn't tied to the input with for=, but it's the only number input.
    this.quantity = this.info.getByRole('spinbutton');
    this.addToCartButton = this.info.getByRole('button', { name: 'Add to cart' });

    this.reviewTab = page.getByRole('link', { name: MESSAGES.reviewHeading });
    this.reviewName = page.getByPlaceholder('Your Name');
    this.reviewEmail = page.getByPlaceholder('Email Address', { exact: true });
    this.reviewText = page.getByPlaceholder('Add Review Here!');
    this.reviewSubmit = page.getByRole('button', { name: 'Submit' });
    this.reviewSuccess = page.getByText(MESSAGES.reviewThanks);
  }

  get marker() {
    return this.info;
  }

  /**
   * Opens a specific product by id, regardless of the id passed to the constructor.
   * @param {number} productId
   * @returns {Promise<void>}
   */
  async openProduct(productId) {
    this.path = `/product_details/${productId}`;
    await this.open();
  }

  /**
   * @returns {RegExp}
   */
  urlPattern() {
    return /\/product_details\/\d+/;
  }

  /**
   * Reads everything in the info panel. Labels like "Brand:" are stripped off.
   * @returns {Promise<ProductDetails>}
   */
  async details() {
    /** @param {import('@playwright/test').Locator} locator */
    const valueOf = async (locator) => (await locator.innerText()).split(':').slice(1).join(':').trim();
    return {
      name: (await this.name.innerText()).trim(),
      category: await valueOf(this.category),
      price: (await this.price.innerText()).trim(),
      availability: await valueOf(this.availability),
      condition: await valueOf(this.condition),
      brand: await valueOf(this.brand),
    };
  }

  /**
   * Replaces the quantity with a new value, typing it key by key like a user would.
   * @param {number} quantity
   * @returns {Promise<void>}
   */
  async setQuantity(quantity) {
    // pressSequentially doesn't replace existing text the way fill() does, so clear the "1" first.
    await this.quantity.clear();
    await this.quantity.pressSequentially(String(quantity));
  }

  /**
   * Clicks "Add to cart" and waits for the server to accept it and the popup to show.
   * @returns {Promise<void>}
   */
  async addToCart() {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/add_to_cart/') && r.ok()),
      this.addToCartButton.click(),
    ]);
    await this.cartModal.title.waitFor({ state: 'visible' });
  }

  /**
   * Fills and submits the "Write Your Review" form.
   * @param {{ name: string, email: string, review: string }} review
   * @returns {Promise<void>}
   */
  async writeReview(review) {
    await this.reviewName.fill(review.name);
    await this.reviewEmail.fill(review.email);
    await this.reviewText.fill(review.review);
    await this.reviewSubmit.click();
  }
}

module.exports = { ProductDetailPage };
