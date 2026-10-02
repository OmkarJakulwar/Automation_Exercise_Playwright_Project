// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { MESSAGES } = require('../../../config/constants');

test.describe('Register user', () => {
  test(
    'TC01 - Register User',
    { tag: ['@smoke', '@regression'] },
    async ({
      page,
      homePage,
      loginSignupPage,
      signupPage,
      accountCreatedPage,
      accountDeletedPage,
      newUser,
    }) => {
      await test.step('Open the home page and check it loaded', async () => {
        await homePage.open();
        await homePage.expectLoaded();
      });

      await test.step("Click 'Signup / Login' and check 'New User Signup!' is visible", async () => {
        await homePage.header.goToSignupLogin();
        await expect(loginSignupPage.signupHeading).toBeVisible();
      });

      await test.step('Enter name and email, then click Signup', async () => {
        await loginSignupPage.startSignup(newUser.name, newUser.email);
        await expect(signupPage.heading).toBeVisible();
      });

      await test.step('Fill account details, date of birth and both opt-in checkboxes', async () => {
        // Name and email carry over from the first step; check they did before we fill the rest.
        await expect(signupPage.name).toHaveValue(newUser.name);
        await expect(signupPage.email).toHaveValue(newUser.email);
        await signupPage.fillAccountInformation(newUser);
        await expect(signupPage.newsletter).toBeChecked();
        await expect(signupPage.specialOffers).toBeChecked();
      });

      await test.step('Fill address details and create the account', async () => {
        await signupPage.fillAddressInformation(newUser);
        await signupPage.submit();
        await expect(accountCreatedPage.heading).toHaveText(MESSAGES.accountCreated, {
          ignoreCase: true,
        });
      });

      await test.step("Click Continue and check 'Logged in as <name>'", async () => {
        await accountCreatedPage.continue();
        await expect(homePage.header.loggedInAs).toHaveText(`Logged in as ${newUser.name}`);
      });

      await test.step('Delete the account and click Continue', async () => {
        await homePage.header.deleteAccount();
        await expect(accountDeletedPage.heading).toHaveText(MESSAGES.accountDeleted, {
          ignoreCase: true,
        });
        await accountDeletedPage.continue();
        await expect(page).toHaveURL('/');
      });
    },
  );

  test(
    'TC05 - Register User with existing email',
    { tag: '@regression' },
    async ({ homePage, loginSignupPage, testUser }) => {
      await test.step('Open the home page and check it loaded', async () => {
        await homePage.open();
        await homePage.expectLoaded();
      });

      await test.step("Click 'Signup / Login' and check 'New User Signup!' is visible", async () => {
        await homePage.header.goToSignupLogin();
        await expect(loginSignupPage.signupHeading).toBeVisible();
      });

      await test.step('Enter a name and an already registered email, then click Signup', async () => {
        // testUser was registered through the API, so its email is taken.
        await loginSignupPage.startSignup(testUser.name, testUser.email);
      });

      await test.step("Check the 'Email Address already exist!' error is visible", async () => {
        await expect(loginSignupPage.signupError).toBeVisible();
        await expect(loginSignupPage.signupHeading).toBeVisible();
      });
    },
  );
});
