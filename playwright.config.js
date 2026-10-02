// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { getEnvironment } = require('./config/environments');

const env = getEnvironment();
const isCI = !!process.env.CI;

// Desktop browser projects all share the same rules about which folders they pick up.
// API tests get their own project, mobile tests their own devices, and the setup/teardown
// files only run as a dependency.
const desktopIgnore = ['**/api/**', '**/mobile/**', '**/*.setup.js', '**/*.teardown.js'];

// Visual baselines and axe results don't change between engines in a way we care about, so we
// only keep them on Chromium. That keeps the snapshot folder to one set of images.
const chromiumOnly = ['**/visual/**', '**/a11y/**'];

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // The site is a shared public demo and can be slow, so give tests more room than the default.
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      // Small tolerance for font anti-aliasing differences between runs.
      maxDiffPixelRatio: 0.01,
    },
  },

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Too many parallel workers against a public site gets us rate limited, so CI defaults to 2.
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : isCI ? 2 : undefined,

  // CI overrides this with --reporter=blob for sharding; these are for normal runs.
  reporter: [
    [isCI ? 'dot' : 'list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: env.baseURL,
    // The site tags most form fields and buttons with data-qa, so getByTestId() maps straight onto it.
    testIdAttribute: 'data-qa',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      // Logs in once and saves storageState for the tests that need a signed-in user.
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      teardown: 'cleanup',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Deletes the account `setup` created, once all the projects that need it are done.
      name: 'cleanup',
      testMatch: /.*\.teardown\.js/,
    },
    {
      name: 'chromium',
      testIgnore: desktopIgnore,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: [...desktopIgnore, ...chromiumOnly],
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: [...desktopIgnore, ...chromiumOnly],
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: '**/mobile/**/*.spec.js',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      testMatch: '**/mobile/**/*.spec.js',
      use: { ...devices['iPhone 14'] },
    },
    {
      // API specs only use the `request` fixture, so no browser gets launched for this project.
      name: 'api',
      testMatch: '**/api/**/*.spec.js',
    },
  ],
});
