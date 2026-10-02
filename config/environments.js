// @ts-check
const path = require('node:path');
const dotenv = require('dotenv');

// Load .env here rather than only in playwright.config.js, so anything that requires this file
// (fixtures, global setup, one-off scripts) sees the same values.
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

/**
 * @typedef {object} Environment
 * @property {string} name
 * @property {string} baseURL - root of the web app, used by page.goto('/...')
 * @property {string} apiURL - root of the public API, used by ApiClient
 */

// NOTE: automationexercise.com only has one public instance, so all three point at the same host.
// The point is to show how switching works; on a real project qa/staging would have their own URLs.
/** @type {Record<string, Environment>} */
const environments = {
  qa: {
    name: 'qa',
    baseURL: 'https://automationexercise.com',
    apiURL: 'https://automationexercise.com/api',
  },
  staging: {
    name: 'staging',
    baseURL: 'https://automationexercise.com',
    apiURL: 'https://automationexercise.com/api',
  },
  prod: {
    name: 'prod',
    baseURL: 'https://automationexercise.com',
    apiURL: 'https://automationexercise.com/api',
  },
};

/**
 * Picks the environment from ENV (defaults to prod). BASE_URL / API_URL in the shell win over the
 * file so a one-off run against another host doesn't need a code change.
 * @returns {Environment}
 */
function getEnvironment() {
  const name = (process.env.ENV || 'prod').toLowerCase();
  const env = environments[name];
  if (!env) {
    // Fail loudly - a typo in ENV silently falling back to prod would be a nasty surprise.
    throw new Error(`Unknown ENV "${name}". Use one of: ${Object.keys(environments).join(', ')}`);
  }
  return {
    ...env,
    baseURL: process.env.BASE_URL || env.baseURL,
    apiURL: process.env.API_URL || env.apiURL,
  };
}

module.exports = { environments, getEnvironment };
