// @ts-check
const { BasePage } = require('./BasePage');

class TestCasesPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/test_cases');
    this.heading = page.getByRole('heading', { name: 'Test Cases', exact: true });
    // Each test case is a collapsible panel whose title link reads "Test Case N: ...".
    this.testCaseLinks = page.getByRole('link', { name: /^Test Case \d+:/ });
  }

  get marker() {
    return this.heading;
  }

  /**
   * Titles of all test cases listed on the page.
   * @returns {Promise<string[]>}
   */
  async testCaseTitles() {
    return (await this.testCaseLinks.allInnerTexts()).map((t) => t.trim());
  }
}

module.exports = { TestCasesPage };
