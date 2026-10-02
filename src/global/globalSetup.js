// @ts-check
const fs = require('node:fs');
const { request } = require('@playwright/test');
const { ALLURE_RESULTS_DIR } = require('../../config/reporting');
const { getEnvironment } = require('../../config/environments');
const { resetLedger } = require('../utils/accountLedger');
const { createLogger } = require('../utils/logger');

const log = createLogger('global-setup');

/**
 * Runs once before any project. If the site is down, every test would fail one by one after its
 * own timeout; checking the API first fails the whole run in seconds with one clear message.
 * @param {import('@playwright/test').FullConfig} config
 * @returns {Promise<void>}
 */
async function globalSetup(config) {
  const env = getEnvironment();
  log.info(`env=${env.name} baseURL=${env.baseURL} workers=${config.workers}`);

  const api = await request.newContext();
  try {
    const response = await api.get(`${env.apiURL}/productsList`, { timeout: 30_000 });
    if (!response.ok()) {
      throw new Error(`${env.apiURL}/productsList answered HTTP ${response.status()}`);
    }
  } catch (error) {
    throw new Error(
      `automationexercise.com looks unreachable, so there's no point starting the run.\n${error}`,
      { cause: error },
    );
  } finally {
    await api.dispose();
  }

  resetLedger();

  // allure-playwright adds to allure-results and never clears it, so without this one report
  // would mix this run with every run before it. Safe here: reporters write their first result
  // after global setup is done.
  fs.rmSync(ALLURE_RESULTS_DIR, { recursive: true, force: true });
}

module.exports = globalSetup;
