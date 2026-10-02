// @ts-check
const { test, expect } = require('../../src/fixtures');
const { readJson } = require('../../src/utils/fileHelper');

/**
 * @typedef {object} Scan
 * @property {string} name
 * @property {string} path
 * @property {string[]} [include] - CSS selectors to limit the scan to; whole page if left out
 * @property {string[]} knownIssues - axe rule ids the site already breaks here
 */
/** @type {{ scans: Scan[] }} */
const { scans } = readJson('a11y.json');

/**
 * Turns axe violations into short lines for the failure message, e.g.
 * "label (critical): Form elements must have labels - #quantity".
 * @param {import('axe-core').Result[]} violations
 * @returns {string[]}
 */
const summarise = (violations) =>
  violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} - ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );

// The site isn't clean and we can't fix it, so a scan that demands zero violations would fail
// forever. Instead each scan lists the axe rules it already breaks (test-data/a11y.json) and the
// test fails on anything new. What's on the lists today:
//   button-name    - icon-only subscribe button in the footer, and the search button on /products
//   link-name      - the carousel arrows on the home page
//   label          - quantity box on product detail, file input on contact us
//   color-contrast - orange-on-grey text all over, and the orange active link in the header
// The login and signup forms are clean, so that scan allows nothing. The full axe report is
// attached to every test, so the known issues stay visible in the HTML report.
test.describe('Accessibility', { tag: '@a11y' }, () => {
  for (const { name, path, include = [], knownIssues } of scans) {
    test(`${name} - no new axe violations`, async ({ page, makeAxeBuilder }, testInfo) => {
      await page.goto(path);

      const builder = makeAxeBuilder();
      for (const selector of include) builder.include(selector);
      const results = await builder.analyze();

      await testInfo.attach('axe-results', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });
      const newViolations = results.violations.filter((v) => !knownIssues.includes(v.id));
      expect(summarise(newViolations), 'violations not in the known-issues list').toEqual([]);
    });
  }
});
