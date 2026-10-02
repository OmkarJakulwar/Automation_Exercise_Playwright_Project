// @ts-check
const { test, expect } = require('../../src/fixtures');
const { API_MESSAGES } = require('../../config/constants');
const { toUserDetail } = require('../../src/utils/dataFactory');

// Set up through the API (fast, no clicking through forms), check through the UI - or the other
// way round. Each test covers something neither layer could show on its own.
test.describe('Accounts across API and UI', { tag: '@regression' }, () => {
  test('Account created through the API can log in through the UI', async ({
    loginSignupPage,
    testUser,
  }) => {
    // testUser was registered through the createAccount API by its fixture.
    await test.step('Log in through the form', async () => {
      await loginSignupPage.open();
      await loginSignupPage.login(testUser.email, testUser.password);
    });

    await test.step('Check the header greets the API-created user', async () => {
      await expect(loginSignupPage.header.loggedInAs).toHaveText(`Logged in as ${testUser.name}`);
    });
  });

  test('Account registered through the UI shows up in the API with the same details', async ({
    loginSignupPage,
    signupPage,
    accountCreatedPage,
    accountApi,
    newUser,
  }) => {
    await test.step('Register through the signup form', async () => {
      await loginSignupPage.open();
      await loginSignupPage.startSignup(newUser.name, newUser.email);
      await signupPage.createAccount(newUser);
      await accountCreatedPage.expectLoaded();
    });

    await test.step('Check getUserDetailByEmail returns what was typed into the form', async () => {
      // Poll rather than read once: if the API ever reads from a replica, the new row can lag a
      // moment behind the page that said "Account Created!".
      await expect
        .poll(async () => (await accountApi.getUserDetailByEmail(newUser.email)).responseCode, {
          message: 'user should be visible through the API',
        })
        .toBe(200);

      const { body } = await accountApi.getUserDetailByEmail(newUser.email);
      expect(body).toMatchSchema('userDetail');
      expect(body.user).toMatchObject(toUserDetail(newUser));
    });
  });

  test('Name changed through the API shows in the UI header', async ({
    homePage,
    loginSignupPage,
    accountApi,
    testUser,
  }) => {
    const renamed = { ...testUser, name: `${testUser.firstName} Renamed` };

    await test.step('Log in through the UI', async () => {
      await loginSignupPage.open();
      await loginSignupPage.loginAndWaitForHome(testUser.email, testUser.password);
      await expect(homePage.header.loggedInAs).toHaveText(`Logged in as ${testUser.name}`);
    });

    await test.step('Change the name through the updateAccount API', async () => {
      const { responseCode, message } = await accountApi.updateAccount(renamed);
      expect(responseCode).toBe(200);
      expect(message).toBe(API_MESSAGES.userUpdated);
    });

    await test.step('Reload until the header shows the new name', async () => {
      // The open page won't change by itself, so each attempt reloads and checks again.
      // toPass retries the whole block, which a single web-first assertion can't do.
      await expect(async () => {
        await homePage.page.reload();
        await expect(homePage.header.loggedInAs).toHaveText(`Logged in as ${renamed.name}`, {
          timeout: 2_000,
        });
      }).toPass({ intervals: [1_000, 2_000, 5_000], timeout: 30_000 });
    });
  });

  test('Account deleted through the API can no longer log in', async ({
    loginSignupPage,
    accountApi,
    testUser,
  }) => {
    await test.step('Delete the account through the API', async () => {
      const { responseCode } = await accountApi.deleteAccount(testUser.email, testUser.password);
      expect(responseCode).toBe(200);
    });

    await test.step('Try the old credentials in the login form', async () => {
      await loginSignupPage.open();
      await loginSignupPage.login(testUser.email, testUser.password);
    });

    await test.step('Check the login is refused', async () => {
      await expect(loginSignupPage.loginError).toBeVisible();
      await expect(loginSignupPage.header.loggedInAs).toBeHidden();
    });
  });
});
