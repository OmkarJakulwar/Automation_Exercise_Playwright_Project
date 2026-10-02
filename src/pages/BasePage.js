// @ts-check
const { expect } = require('@playwright/test');
const { HeaderComponent } = require('../components/HeaderComponent');
const { FooterComponent } = require('../components/FooterComponent');

/**
 * Shared bits for every page: the header and footer, opening the page by its path, and a few
 * scroll helpers. Page-specific parts are composed in by subclasses, not inherited from here.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} path - path relative to baseURL, e.g. "/login"
   */
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
  }

  /**
   * Something that's only on this page and is visible once it has rendered. Subclasses override
   * it so expectLoaded() can tell the pages apart.
   * @returns {import('@playwright/test').Locator}
   */
  get marker() {
    return this.header.logo;
  }

  /**
   * Goes straight to the page by URL.
   * @returns {Promise<void>}
   */
  async open() {
    await this.page.goto(this.path);
  }

  /**
   * Checks we're on this page: URL matches and the page's marker element is visible.
   * @returns {Promise<void>}
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(this.urlPattern());
    await expect(this.marker, `${this.constructor.name} should be visible`).toBeVisible();
  }

  /**
   * URL matcher for this page. Default is "path, optionally followed by a query or hash".
   * @returns {RegExp}
   */
  urlPattern() {
    const escaped = this.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escaped === '/' ? '/' : escaped}([?#].*)?$`);
  }

  /**
   * Scrolls to the footer.
   * @returns {Promise<void>}
   */
  async scrollToBottom() {
    await this.footer.scrollIntoView();
  }

  /**
   * Scrolls back to the top with the mouse wheel, the way a user would without the arrow button.
   * @returns {Promise<void>}
   */
  async scrollToTopWithMouse() {
    // Firefox caps how far one wheel event scrolls, so a single big delta stops part way down.
    // Keep wheeling until we're at the top, like a user flicking the wheel a few times.
    for (let attempt = 0; attempt < 20; attempt++) {
      const y = await this.scrollY();
      if (y === 0) return;
      await this.page.mouse.wheel(0, -y);
      // wheel() returns before the scroll lands, so wait for the position to actually move.
      await this.page.waitForFunction((before) => window.scrollY < before, y);
    }
  }

  /**
   * Current vertical scroll offset in pixels.
   * @returns {Promise<number>}
   */
  async scrollY() {
    return this.page.evaluate(() => window.scrollY);
  }
}

module.exports = { BasePage };
