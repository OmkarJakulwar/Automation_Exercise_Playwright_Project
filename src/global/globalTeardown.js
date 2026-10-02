// @ts-check
const { request } = require('@playwright/test');
const { getEnvironment } = require('../../config/environments');
const { leftoverAccounts, resetLedger } = require('../utils/accountLedger');
const { createLogger } = require('../utils/logger');

const log = createLogger('global-teardown');

/**
 * Runs once after everything. Deletes any test account that a killed worker didn't get to clean
 * up (see accountLedger.js). On a normal run there's nothing to do.
 * @returns {Promise<void>}
 */
async function globalTeardown() {
  const leftovers = leftoverAccounts();
  if (leftovers.length > 0) {
    const env = getEnvironment();
    const api = await request.newContext();
    for (const { email, password } of leftovers) {
      // Fire-and-forget per account: a failure here shouldn't fail a run whose tests all passed.
      const response = await api
        .delete(`${env.apiURL}/deleteAccount`, { form: { email, password } })
        .catch((error) => log.warn(`could not delete ${email}: ${error}`));
      if (response) log.info(`swept leftover account ${email}`);
    }
    await api.dispose();
  }
  resetLedger();
}

module.exports = globalTeardown;
