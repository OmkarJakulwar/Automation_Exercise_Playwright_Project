// @ts-check
const { test, expect } = require('../../../src/fixtures');

test.describe('Scroll up and down', () => {
  test.beforeEach(async ({ homePage }) => {
    await test.step('Open the home page and check it loaded', async () => {
      await homePage.open();
      await homePage.expectLoaded();
    });

    await test.step("Scroll down to the bottom and check 'Subscription' is visible", async () => {
      await homePage.scrollToBottom();
      await expect(homePage.footer.subscriptionHeading).toBeInViewport();
      await expect(homePage.heroTagline).not.toBeInViewport();
    });
  });

  test(
    "TC25 - Verify Scroll Up using 'Arrow' button and Scroll Down functionality",
    { tag: '@regression' },
    async ({ homePage }) => {
      await test.step('Click the arrow at the bottom right', async () => {
        // The plugin only shows the arrow once you've scrolled a fair way down.
        await expect(homePage.scrollUpArrow).toBeVisible();
        await homePage.clickScrollUpArrow();
      });

      await test.step('Check the page scrolled up and the hero tagline is on screen', async () => {
        // The arrow animates the scroll, so poll until it settles at the top.
        await expect.poll(() => homePage.scrollY()).toBe(0);
        await expect(homePage.heroTagline).toBeInViewport();
      });
    },
  );

  test(
    "TC26 - Verify Scroll Up without 'Arrow' button and Scroll Down functionality",
    { tag: '@regression' },
    async ({ homePage }) => {
      await test.step('Scroll up to the top', async () => {
        await homePage.scrollToTopWithMouse();
      });

      await test.step('Check the page scrolled up and the hero tagline is on screen', async () => {
        await expect.poll(() => homePage.scrollY()).toBe(0);
        await expect(homePage.heroTagline).toBeInViewport();
      });
    },
  );
});
