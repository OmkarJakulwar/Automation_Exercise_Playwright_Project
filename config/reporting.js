// @ts-check
const os = require('node:os');
const path = require('node:path');
const { Status } = require('allure-js-commons');
const { version: playwrightVersion } = require('@playwright/test/package.json');

const ALLURE_RESULTS_DIR = path.resolve(__dirname, '../allure-results');

/**
 * Allure's failure buckets, checked top to bottom - first match wins. Without them every failure
 * lands in "Product defects", and you can't tell "the site was slow" from "the cart is broken"
 * without opening each one.
 * @type {import('allure-js-commons/sdk').Category[]}
 */
const ALLURE_CATEGORIES = [
  {
    // Locator/navigation timeouts and whole-test timeouts, not expect timeouts: a toHaveText that
    // never matched is a real failure even though it waited.
    name: 'Site slow or unreachable',
    description: 'Timeouts and network errors. Usually the public demo site, not our code.',
    messageRegex:
      '(?s).*(TimeoutError|Test timeout of \\d+ms exceeded|net::ERR_|NS_ERROR_|ECONNRESET|ETIMEDOUT).*',
    matchedStatuses: [Status.FAILED, Status.BROKEN],
  },
  {
    name: 'Visual differences',
    messageRegex: '(?s).*(toHaveScreenshot|pixels .* are different).*',
    matchedStatuses: [Status.FAILED],
  },
  {
    name: 'New accessibility violations',
    messageRegex: '(?s).*violations not in the known-issues list.*',
    matchedStatuses: [Status.FAILED],
  },
  {
    name: 'API contract changes',
    messageRegex: "(?s).*doesn't match schema.*",
    matchedStatuses: [Status.FAILED],
  },
  {
    // allure-playwright reports thrown errors as "failed", same as assertions, so we can't go by
    // status here. A plain JS error almost always means a bug in the test code.
    name: 'Test defects',
    description: 'Errors thrown by the test code itself.',
    messageRegex: '(?s)^(TypeError|ReferenceError|SyntaxError|RangeError)\\b.*',
    matchedStatuses: [Status.FAILED, Status.BROKEN],
  },
  { name: 'Product defects', matchedStatuses: [Status.FAILED] },
  { name: 'Flaky tests', matchedStatuses: [Status.PASSED], flaky: true },
];

/**
 * Options for the allure-playwright reporter. The environment block shows up on the report's
 * overview page, so you can tell which env, browser build and machine produced a report.
 * @param {import('./environments').Environment} env
 * @returns {import('allure-js-commons/sdk/reporter').ReporterConfig & { detail?: boolean }}
 */
function allureOptions(env) {
  return {
    resultsDir: ALLURE_RESULTS_DIR,
    // Only test.step blocks and attachments, so Allure reads like the manual test case. Every
    // click and expect is still in the Playwright HTML report and the trace.
    detail: false,
    environmentInfo: {
      ENV: env.name,
      BASE_URL: env.baseURL,
      API_URL: env.apiURL,
      PLAYWRIGHT: playwrightVersion,
      NODE: process.version,
      OS: `${os.platform()} ${os.release()}`,
      CI: process.env.CI ? 'yes' : 'no',
    },
    categories: ALLURE_CATEGORIES,
  };
}

module.exports = { allureOptions, ALLURE_RESULTS_DIR, ALLURE_CATEGORIES };
