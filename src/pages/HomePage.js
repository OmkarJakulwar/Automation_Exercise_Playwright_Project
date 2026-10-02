// @ts-check
const { BasePage } = require('./BasePage');
const { ProductGrid } = require('../components/ProductGrid');
const { CategorySidebar } = require('../components/CategorySidebar');
const { BrandSidebar } = require('../components/BrandSidebar');
const { MESSAGES } = require('../../config/constants');

class HomePage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/');
    this.products = new ProductGrid(page);
    this.recommended = new ProductGrid(page, '.recommended_items');
    this.categories = new CategorySidebar(page);
    this.brands = new BrandSidebar(page);

    // The carousel repeats the tagline on every slide and only the active one is visible,
    // so filter to the visible copy instead of picking a slide by index.
    this.heroTagline = page
      .getByRole('heading', { name: MESSAGES.heroTagline })
      .filter({ visible: true });
    this.carousel = page.locator('#slider-carousel');
    this.recommendedHeading = page.getByRole('heading', { name: MESSAGES.recommendedItems });
    // Injected by the jQuery scrollUp plugin. It's an icon-only link with no name, so the id it
    // gets from the plugin is the only way to find it.
    this.scrollUpArrow = page.locator('#scrollUp');
  }

  get marker() {
    return this.products.title;
  }

  /** @returns {Promise<void>} */
  async clickScrollUpArrow() {
    await this.scrollUpArrow.click();
  }

  /** @returns {Promise<void>} */
  async scrollToRecommended() {
    await this.recommendedHeading.scrollIntoViewIfNeeded();
  }
}

module.exports = { HomePage };
