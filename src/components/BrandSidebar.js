// @ts-check

/**
 * "Brands" list on the left of the home and products pages (TC19).
 */
class BrandSidebar {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // Same story as the category sidebar - no role to hang this on, so we use the wrapper class.
    this.root = page.locator('.brands_products');
    this.heading = this.root.getByRole('heading', { name: 'Brands' });
    this.links = this.root.getByRole('link');
  }

  /**
   * Link for one brand. Each link reads like "(6)Polo", so we match the name at the end.
   * @param {string} brand
   * @returns {import('@playwright/test').Locator}
   */
  brandLink(brand) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.links.filter({ hasText: new RegExp(`\\)\\s*${escaped}$`) });
  }

  /**
   * @param {string} brand
   * @returns {Promise<void>}
   */
  async open(brand) {
    await this.brandLink(brand).click();
    await this.page.waitForURL('**/brand_products/**');
  }

  /**
   * Brand names as shown in the sidebar, without the "(6)" counts.
   * @returns {Promise<string[]>}
   */
  async names() {
    const texts = await this.links.allInnerTexts();
    return texts.map((t) => t.replace(/^\(\d+\)\s*/, '').trim());
  }
}

module.exports = { BrandSidebar };
