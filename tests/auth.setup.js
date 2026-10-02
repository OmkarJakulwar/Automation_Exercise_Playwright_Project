// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const { test: setup, expect } = require('../src/fixtures');
const { AUTH_STATE_FILE, AUTH_USER_FILE } = require('../config/constants');
const { buildUser } = require('../src/utils/dataFactory');

// Runs once per `playwright test` run, before the browser projects. It makes an account through
// the API (quick) and logs in through the real form (so the cookies are exactly what a user gets),
// then saves the session for specs that `test.use({ storageState: AUTH_STATE_FILE })`.
//
// NOTE: the site keeps the cart per account, not per session, so every test sharing this login
// shares one cart. Only use the saved login for tests that don't touch the cart; anything that
// does should use its own `testUser` / `newUser`.
setup('create a user and save the logged-in session', async ({ accountApi, loginSignupPage }) => {
  const user = buildUser();
  const created = await accountApi.createAccount(user);
  expect(created.responseCode, created.message).toBe(201);

  await loginSignupPage.open();
  await loginSignupPage.login(user.email, user.password);
  await expect(loginSignupPage.header.loggedInAs).toHaveText(`Logged in as ${user.name}`);

  fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });
  await loginSignupPage.page.context().storageState({ path: AUTH_STATE_FILE });
  // Tests need the user's details (name, address) as well as the cookies, and teardown needs the
  // password to delete the account.
  fs.writeFileSync(AUTH_USER_FILE, JSON.stringify(user, null, 2));
});
