// @ts-check

/**
 * The "Category" accordion on the left of the home and products pages (TC18).
 */
class CategorySidebar {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // No landmark or role around the sidebar, so we anchor on the accordion's id.
    this.root = page.locator('#accordian');
    this.heading = page.getByRole('heading', { name: 'Category', exact: true });
  }

  /**
   * One accordion panel ("Women", "Men", "Kids"). We match on the panel heading because "Dress"
   * exists under both Women and Kids, so sub-category links are only unique inside their panel.
   * @param {string} category
   * @returns {import('@playwright/test').Locator}
   */
  panel(category) {
    return this.root
      .locator('.panel')
      .filter({ has: this.page.getByRole('heading', { name: this.titlePattern(category) }) });
  }

  /**
   * The heading's accessible name starts with a Font Awesome glyph (" Women"), so exact matching
   * fails, and a plain substring match would let "Men" hit "Women". Anchoring on a word boundary
   * at the end handles both.
   * @param {string} category
   * @returns {RegExp}
   */
  titlePattern(category) {
    return new RegExp(`\\b${category}$`);
  }

  /**
   * Expands a top-level category.
   * @param {string} category - e.g. "Women"
   * @returns {Promise<void>}
   */
  async expand(category) {
    await this.panel(category).getByRole('link', { name: this.titlePattern(category) }).click();
  }

  /**
   * Expands the parent category and opens one of its sub-categories.
   * @param {string} category - e.g. "Women"
   * @param {string} subCategory - e.g. "Tops"
   * @returns {Promise<void>}
   */
  async openSubCategory(category, subCategory) {
    const panel = this.panel(category);
    await this.expand(category);
    // Bootstrap animates the collapse open; clicking mid-animation sometimes lands on nothing,
    // so wait until the link is actually visible.
    const link = panel.getByRole('link', { name: subCategory, exact: true });
    await link.waitFor({ state: 'visible' });
    await link.click();
    // Without this, a follow-up click can land on the old page while the new one is loading.
    await this.page.waitForURL('**/category_products/**');
  }
}

module.exports = { CategorySidebar };
