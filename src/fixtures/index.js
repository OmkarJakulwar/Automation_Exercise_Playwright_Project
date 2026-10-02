// @ts-check
const { test: base } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const { expect } = require('./matchers');
const fs = require('node:fs');
const { getEnvironment } = require('../../config/environments');
const {
  BLOCKED_HOSTS,
  PRODUCT_IMAGE_URL,
  AUTH_USER_FILE,
  WCAG_TAGS,
} = require('../../config/constants');
const { ApiClient } = require('../api/ApiClient');
const { AccountApi } = require('../api/AccountApi');
const { ProductsApi } = require('../api/ProductsApi');
const { BrandsApi } = require('../api/BrandsApi');
const { buildUser } = require('../utils/dataFactory');
const { recordCreated, recordDeleted } = require('../utils/accountLedger');
const { createLogger } = require('../utils/logger');
const { HomePage } = require('../pages/HomePage');
const { LoginSignupPage } = require('../pages/LoginSignupPage');
const { SignupPage } = require('../pages/SignupPage');
const { AccountCreatedPage } = require('../pages/AccountCreatedPage');
const { AccountDeletedPage } = require('../pages/AccountDeletedPage');
const { ProductsPage } = require('../pages/ProductsPage');
const { ProductDetailPage } = require('../pages/ProductDetailPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { PaymentPage } = require('../pages/PaymentPage');
const { ContactUsPage } = require('../pages/ContactUsPage');
const { TestCasesPage } = require('../pages/TestCasesPage');

const log = createLogger('fixtures');
const env = getEnvironment();

// 1x1 grey PNG served in place of real product images.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/**
 * Aborts requests to ad / analytics hosts on a context.
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string[]} hosts
 * @returns {Promise<() => number>} how many requests have been blocked so far
 */
async function blockAds(context, hosts) {
  let blocked = 0;
  await context.route(
    (url) => hosts.some((host) => url.hostname.endsWith(host)),
    (route) => {
      blocked += 1;
      return route.abort('blockedbyclient');
    },
  );
  return () => blocked;
}

/**
 * Answers product image requests with a 1x1 PNG. See the productImages fixture for why.
 * @param {import('@playwright/test').BrowserContext} context
 * @returns {Promise<void>}
 */
async function stubImages(context) {
  await context.route(PRODUCT_IMAGE_URL, (route) =>
    route.fulfill({ contentType: 'image/png', body: PLACEHOLDER_PNG }),
  );
}

/** @typedef {import('../utils/dataFactory').User} User */
/** @typedef {{ id: number, name: string, price: string, brand: string, category: any }} CatalogProduct */

/**
 * @typedef {object} ApiFixtures
 * @property {ApiClient} apiClient - talks to the public API, no browser needed
 * @property {AccountApi} accountApi
 * @property {ProductsApi} productsApi
 * @property {BrandsApi} brandsApi
 * @property {User} testUser - registered through the API before the test, deleted after it
 * @property {User} newUser - fresh data only, not registered. Deleted after the test in case the
 *   test registered it through the UI and then failed before its own clean-up step.
 */

/**
 * @typedef {object} WorkerFixtures
 * @property {CatalogProduct[]} productCatalog - full product list, fetched once per worker
 */

/**
 * @typedef {object} UiFixtures
 * @property {string[]} adBlockHosts - option: hosts the ad blocker aborts. Override with test.use().
 * @property {void} adBlocker - auto fixture, runs for every UI test
 * @property {boolean} stubProductImages - option: serve a placeholder instead of real product
 *   images. On by default; visual tests turn it off with test.use().
 * @property {void} productImages - auto fixture that applies stubProductImages
 * @property {HomePage} homePage
 * @property {LoginSignupPage} loginSignupPage
 * @property {SignupPage} signupPage
 * @property {AccountCreatedPage} accountCreatedPage
 * @property {AccountDeletedPage} accountDeletedPage
 * @property {ProductsPage} productsPage
 * @property {ProductDetailPage} productDetailPage
 * @property {CartPage} cartPage
 * @property {CheckoutPage} checkoutPage
 * @property {PaymentPage} paymentPage
 * @property {ContactUsPage} contactUsPage
 * @property {TestCasesPage} testCasesPage
 * @property {() => Promise<import('@playwright/test').BrowserContext>} openContext - opens another
 *   browser context (a second, separate shopper) with the same baseURL, ad blocking and image
 *   stubbing as the default one. Closed automatically after the test.
 * @property {User} authUser - the account behind the saved login from tests/auth.setup.js. Pair it
 *   with test.use({ storageState: AUTH_STATE_FILE }).
 * @property {() => AxeBuilder} makeAxeBuilder - axe scanner for the current page, preset to our
 *   WCAG tags. Chain .include() / .exclude() / .disableRules() before .analyze().
 */

/** @typedef {import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions} BuiltInTestArgs */
/** @typedef {import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions} BuiltInWorkerArgs */

/**
 * Deletes an account and only complains if something unexpected comes back. A 404 is fine -
 * it just means the test already deleted the user itself (most official cases end that way).
 * @param {AccountApi} accountApi
 * @param {User} user
 */
async function deleteQuietly(accountApi, user) {
  const { responseCode, message } = await accountApi.deleteAccount(user.email, user.password);
  if (responseCode === 200 || responseCode === 404) {
    recordDeleted(user.email);
    if (responseCode === 200) log.debug(`cleaned up ${user.email}`);
  } else {
    log.warn(`clean-up for ${user.email} returned ${responseCode}: ${message}`);
  }
}

// API-level fixtures. API specs import `apiTest` so they never pull in the browser fixtures below -
// an auto fixture that touches `context` would launch a browser for every API test.
const apiTest = base.extend(
  /** @type {import('@playwright/test').Fixtures<ApiFixtures, WorkerFixtures, BuiltInTestArgs, BuiltInWorkerArgs>} */ ({
    // Passing testInfo means every API call made in a test shows up as an attachment in the report.
    apiClient: async ({ request }, use, testInfo) => {
      await use(new ApiClient(request, env.apiURL, testInfo));
    },

    accountApi: async ({ apiClient }, use) => use(new AccountApi(apiClient)),
    productsApi: async ({ apiClient }, use) => use(new ProductsApi(apiClient)),
    brandsApi: async ({ apiClient }, use) => use(new BrandsApi(apiClient)),

    // Setup and teardown in one place: create the user, hand it to the test, delete it afterwards
    // even if the test failed halfway through.
    testUser: async ({ accountApi }, use) => {
      const user = buildUser();
      const created = await accountApi.createAccount(user);
      if (created.responseCode !== 201) {
        throw new Error(`Could not create test user: ${created.responseCode} ${created.message}`);
      }
      recordCreated(user);
      await use(user);
      await deleteQuietly(accountApi, user);
    },

    newUser: async ({ accountApi }, use) => {
      const user = buildUser();
      // Recorded up front: the test may register it through the UI and then get killed.
      recordCreated(user);
      await use(user);
      await deleteQuietly(accountApi, user);
    },

    // Worker-scoped: the catalogue doesn't change during a run, so fetch it once per worker
    // instead of once per test. Uses its own request context because the test-scoped `request`
    // fixture isn't available at worker scope.
    productCatalog: [
      async ({ playwright }, use) => {
        const request = await playwright.request.newContext();
        const { body } = await new ApiClient(request, env.apiURL).get('productsList');
        await use(body.products);
        await request.dispose();
      },
      { scope: 'worker' },
    ],
  }),
);

const test = apiTest.extend(
  /** @type {import('@playwright/test').Fixtures<UiFixtures, {}, BuiltInTestArgs & ApiFixtures, BuiltInWorkerArgs & WorkerFixtures>} */ ({
    adBlockHosts: [[...BLOCKED_HOSTS], { option: true }],

    // The site loads Google ads, and every so often one of them is a full-page "vignette"
    // (URL gets #google_vignette) that swallows the next click. Rather than trying to close
    // it, we stop those hosts from loading at all. We route on the context, not the page, so
    // popups and new tabs are covered too.
    adBlocker: [
      async ({ context, adBlockHosts }, use) => {
        const blocked = await blockAds(context, adBlockHosts);
        await use();
        log.debug(`ad blocker aborted ${blocked()} requests`);
      },
      { auto: true },
    ],

    stubProductImages: [true, { option: true }],

    // The home and products pages pull ~35 thumbnails from /get_product_picture/<id>, and the
    // server hands them out slowly: the load event takes 10-25s, and a few parallel workers push
    // that past the navigation timeout. We wait for load on every navigation (see
    // HeaderComponent.navigate), so we answer those requests with a 1x1 PNG instead. None of the
    // functional tests look at the pictures themselves.
    productImages: [
      async ({ context, stubProductImages }, use) => {
        if (stubProductImages) await stubImages(context);
        await use();
      },
      { auto: true },
    ],

    // EU visitors get a Funding Choices consent dialog. It's normally blocked along with the ads,
    // but if it ever gets through (new host, or a test that unblocks it) this handler clicks
    // "Consent" whenever it pops up in front of something we're about to interact with.
    page: async ({ page }, use) => {
      await page.addLocatorHandler(
        page.getByRole('dialog', { name: /consent to use your data/i }),
        async (dialog) => {
          await dialog.getByRole('button', { name: 'Consent' }).click();
        },
      );
      await use(page);
    },

    homePage: async ({ page }, use) => use(new HomePage(page)),
    loginSignupPage: async ({ page }, use) => use(new LoginSignupPage(page)),
    signupPage: async ({ page }, use) => use(new SignupPage(page)),
    accountCreatedPage: async ({ page }, use) => use(new AccountCreatedPage(page)),
    accountDeletedPage: async ({ page }, use) => use(new AccountDeletedPage(page)),
    productsPage: async ({ page }, use) => use(new ProductsPage(page)),
    productDetailPage: async ({ page }, use) => use(new ProductDetailPage(page)),
    cartPage: async ({ page }, use) => use(new CartPage(page)),
    checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
    paymentPage: async ({ page }, use) => use(new PaymentPage(page)),
    contactUsPage: async ({ page }, use) => use(new ContactUsPage(page)),
    testCasesPage: async ({ page }, use) => use(new TestCasesPage(page)),

    // browser.newContext() doesn't pick up the project's `use` settings or our auto fixtures, so
    // this hands out contexts that behave like the default one. Used for "two users at once" tests.
    openContext: async ({ browser, baseURL, adBlockHosts, stubProductImages }, use) => {
      /** @type {import('@playwright/test').BrowserContext[]} */
      const opened = [];
      await use(async () => {
        const context = await browser.newContext({ baseURL });
        await blockAds(context, adBlockHosts);
        if (stubProductImages) await stubImages(context);
        opened.push(context);
        return context;
      });
      await Promise.all(opened.map((context) => context.close()));
    },

    // eslint-disable-next-line no-empty-pattern
    authUser: async ({}, use) => {
      if (!fs.existsSync(AUTH_USER_FILE)) {
        throw new Error(
          `${AUTH_USER_FILE} is missing - run with the setup project (don't pass --no-deps)`,
        );
      }
      await use(JSON.parse(fs.readFileSync(AUTH_USER_FILE, 'utf8')));
    },

    // A factory rather than a ready builder, so a test can run more than one scan. The ad slots
    // stay in the DOM as empty <ins> tags even with the ad hosts blocked, and they're Google's
    // markup, not the site's, so we leave them out.
    makeAxeBuilder: async ({ page }, use) => {
      await use(() => new AxeBuilder({ page }).withTags([...WCAG_TAGS]).exclude('ins.adsbygoogle'));
    },
  }),
);

module.exports = { test, apiTest, expect };
