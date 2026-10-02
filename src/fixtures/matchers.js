// @ts-check
const { expect: baseExpect } = require('@playwright/test');
const { validateSchema } = require('../schemas');

/**
 * Our own matchers on top of Playwright's expect. Specs get them through src/fixtures.
 */
const expect = baseExpect.extend({
  /**
   * Checks a parsed API body against one of the JSON schemas in src/schemas.
   * Usage: expect(body).toMatchSchema('productsList')
   * @param {unknown} received
   * @param {import('../schemas').SchemaName} schemaName
   */
  toMatchSchema(received, schemaName) {
    const { valid, errors } = validateSchema(schemaName, received);
    return {
      pass: valid,
      name: 'toMatchSchema',
      expected: schemaName,
      actual: received,
      message: () =>
        valid
          ? `Expected body not to match schema "${schemaName}", but it did`
          : `Body doesn't match schema "${schemaName}":\n  ${errors.join('\n  ')}`,
    };
  },

  /**
   * Retrying check that an element shows a price, e.g. expect(card.price).toHavePrice(500).
   * Compares the number rather than the exact string, so "Rs. 500" and "Rs.500" both pass.
   * @param {import('@playwright/test').Locator} locator
   * @param {number} expected
   * @param {{ timeout?: number }} [options]
   */
  async toHavePrice(locator, expected, options) {
    const assertionName = 'toHavePrice';
    const pattern = new RegExp(`^\\s*Rs\\.\\s*${expected}\\s*$`);
    /** @type {any} */
    let matcherResult;
    let pass;
    try {
      // Reuse toHaveText for the waiting and retrying; we just supply the pattern.
      const assertion = this.isNot ? baseExpect(locator).not : baseExpect(locator);
      await assertion.toHaveText(pattern, options);
      pass = !this.isNot;
    } catch (error) {
      matcherResult = /** @type {any} */ (error).matcherResult;
      pass = this.isNot;
    }
    const actual = matcherResult?.actual;
    return {
      pass,
      name: assertionName,
      expected,
      actual,
      message: () =>
        `${this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot })}\n\n` +
        `Locator: ${locator}\n` +
        `Expected: ${this.isNot ? 'not ' : ''}Rs. ${expected}\n` +
        `Received: ${this.utils.printReceived(actual)}`,
    };
  },
});

module.exports = { expect };
