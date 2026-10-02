// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { MESSAGES } = require('../../../config/constants');
const { readJson } = require('../../../src/utils/fileHelper');

/** @type {{ invalidLogins: { case: string, email: string, password: string }[] }} */
const { invalidLogins } = readJson('users.json');

test.describe('Login and logout', () => {
  test.beforeEach(async ({ homePage, loginSignupPage }) => {
    await homePage.open();
    await homePage.expectLoaded();
    await homePage.header.goToSignupLogin();
    await expect(loginSignupPage.loginHeading).toBeVisible();
  });

  test(
    'TC02 - Login User with correct email and password',
    { tag: ['@smoke', '@regression'] },
    async ({ homePage, loginSignupPage, accountDeletedPage, testUser }) => {
      await test.step('Enter correct email and password, then click Login', async () => {
        await loginSignupPage.login(testUser.email, testUser.password);
      });

      await test.step("Check 'Logged in as <name>' is visible", async () => {
        await expect(homePage.header.loggedInAs).toHaveText(`Logged in as ${testUser.name}`);
      });

      await test.step("Delete the account and check 'Account Deleted!' is visible", async () => {
        await homePage.header.deleteAccount();
        await expect(accountDeletedPage.heading).toHaveText(MESSAGES.accountDeleted, {
          ignoreCase: true,
        });
      });
    },
  );

  // Same steps for each bad combination in users.json, one test per row so a failure points
  // straight at the input that broke.
  for (const { case: label, email, password } of invalidLogins) {
    test(
      `TC03 - Login User with incorrect email and password (${label})`,
      { tag: '@regression' },
      async ({ page, homePage, loginSignupPage }) => {
        await test.step('Enter incorrect email and password, then click Login', async () => {
          await loginSignupPage.login(email, password);
        });

        await test.step("Check the 'Your email or password is incorrect!' error is visible", async () => {
          await expect(loginSignupPage.loginError).toBeVisible();
          await expect(page).toHaveURL(loginSignupPage.urlPattern());
          await expect(homePage.header.loggedInAs).toBeHidden();
        });
      },
    );
  }

  test(
    'TC04 - Logout User',
    { tag: ['@smoke', '@regression'] },
    async ({ homePage, loginSignupPage, testUser }) => {
      await test.step('Enter correct email and password, then click Login', async () => {
        await loginSignupPage.login(testUser.email, testUser.password);
        await expect(homePage.header.loggedInAs).toHaveText(`Logged in as ${testUser.name}`);
      });

      await test.step('Click Logout and check we are back on the login page', async () => {
        await homePage.header.logout();
        await loginSignupPage.expectLoaded();
        await expect(homePage.header.loggedInAs).toBeHidden();
        await expect(homePage.header.signupLoginLink).toBeVisible();
      });
    },
  );
});
