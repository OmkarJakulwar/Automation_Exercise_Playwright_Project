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
});

module.exports = { expect };
