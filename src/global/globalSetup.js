// @ts-check
const { request } = require('@playwright/test');
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
    );
  } finally {
    await api.dispose();
  }

  resetLedger();
}

module.exports = globalSetup;
