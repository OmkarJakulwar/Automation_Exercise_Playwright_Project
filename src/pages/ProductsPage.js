// @ts-check
const { BasePage } = require('./BasePage');
const { ProductGrid } = require('../components/ProductGrid');
const { CategorySidebar } = require('../components/CategorySidebar');
const { BrandSidebar } = require('../components/BrandSidebar');
const { MESSAGES } = require('../../config/constants');

/**
 * /products, plus the category, brand and search result pages, which share the same layout
 * and only change the grid title.
 */
class ProductsPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/products');
    this.grid = new ProductGrid(page);
    this.categories = new CategorySidebar(page);
    this.brands = new BrandSidebar(page);
    this.allProductsHeading = page.getByRole('heading', { name: MESSAGES.allProducts });
    this.searchedProductsHeading = page.getByRole('heading', { name: MESSAGES.searchedProducts });
    this.searchInput = page.getByPlaceholder('Search Product');
    // Icon-only button with no accessible name, so we fall back to its id.
    this.searchButton = page.locator('#submit_search');
  }

  get marker() {
    return this.allProductsHeading;
  }

  /**
   * Searches for a product and waits for the results page to load.
   * @param {string} term - what the user types in the search box
   * @returns {Promise<void>}
   */
  async search(term) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    // The button just rewrites the URL to ?search=..., so the URL change is our signal.
    await this.page.waitForURL(/\/products\?search=/);
  }
}

module.exports = { ProductsPage };
