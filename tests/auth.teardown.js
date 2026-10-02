// @ts-check
const fs = require('node:fs');
const { apiTest: teardown, expect } = require('../src/fixtures');
const { AUTH_STATE_FILE, AUTH_USER_FILE } = require('../config/constants');
const { recordDeleted } = require('../src/utils/accountLedger');

// Runs after every project that depends on `setup` has finished, and deletes the account
// auth.setup.js created so the public site doesn't fill up with our users.
teardown('delete the saved-session user', async ({ accountApi }) => {
  teardown.skip(!fs.existsSync(AUTH_USER_FILE), 'setup never wrote a user, nothing to clean up');

  /** @type {import('../src/utils/dataFactory').User} */
  const user = JSON.parse(fs.readFileSync(AUTH_USER_FILE, 'utf8'));
  const { responseCode, message } = await accountApi.deleteAccount(user.email, user.password);
  expect(responseCode, message).toBe(200);
  recordDeleted(user.email);

  fs.rmSync(AUTH_USER_FILE);
  fs.rmSync(AUTH_STATE_FILE, { force: true });
});
