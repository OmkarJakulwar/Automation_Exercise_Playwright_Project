// @ts-check

// Used only by `npx playwright merge-reports` in CI, to turn the shards' blob reports into the
// same HTML and JUnit output a local run gives. Kept apart from playwright.config.js so merging
// doesn't load the projects, global setup and the rest.
const { getEnvironment } = require('./config/environments');
const { htmlReporter, junitReporter } = require('./config/reporting');

module.exports = {
  testDir: './tests',
  reporter: [htmlReporter(getEnvironment()), junitReporter],
};
