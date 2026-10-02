// @ts-check
const { test, expect } = require('../../src/fixtures');
const { readJson } = require('../../src/utils/fileHelper');

/** @type {{ cartPair: { name: string }[] }} */
const { cartPair } = readJson('products.json');
/** @type {{ locale: string, timezoneId: string, geolocation: { latitude: number, longitude: number } }} */
const emulation = readJson('emulation.json');

// These run in the mobile-chrome (Pixel 7) and mobile-safari (iPhone 14) projects, which set the
// viewport, user agent and touch support for us.
test.describe('Mobile', { tag: '@mobile' }, () => {
  test('Home page fits the screen and the nav is usable', async ({
    page,
    homePage,
    productsPage,
  }) => {
    await homePage.open();
    await homePage.expectLoaded();

    // No hamburger menu on this site: the nav links just wrap onto extra lines.
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth, 'page should not scroll sideways').toBeLessThanOrEqual(innerWidth);

    await homePage.header.goToProducts();
    await productsPage.expectLoaded();
  });

  test('Shopper adds a product to the cart with taps', async ({ homePage, cartPage }) => {
    const [{ name }] = cartPair;
    await homePage.open();

    await homePage.products.tapAddToCart(name);
    await homePage.products.cartModal.viewCartLink.tap();
    await homePage.page.waitForURL('**/view_cart');

    await expect(cartPage.row(name)).toBeVisible();
  });

  test.describe('Emulated locale, timezone and location', () => {
    test.use({
      locale: emulation.locale,
      timezoneId: emulation.timezoneId,
      geolocation: emulation.geolocation,
      permissions: ['geolocation'],
    });

    test('Browser reports the emulated settings to the page and the server', async ({
      page,
      homePage,
      browserName,
    }) => {
      // The site doesn't localise anything, so we check what it *would* see: the request header
      // and the browser APIs. This is the setup a geo- or locale-aware page would need.
      const request = page.waitForRequest((r) => r.resourceType() === 'document');
      await homePage.open();
      if (browserName === 'webkit') {
        // WebKit adds Accept-Language below the layer Playwright can see, so the header never
        // shows up in request.allHeaders(). The browser-side checks below still cover the locale.
        test.info().annotations.push({
          type: 'note',
          description: 'Accept-Language not visible to Playwright on WebKit',
        });
      } else {
        const headers = await (await request).allHeaders();
        expect(headers['accept-language']).toContain(emulation.locale);
      }

      // Timezones are compared by the wall-clock time they give for a fixed moment, not by name:
      // Chromium reports the old alias "Asia/Calcutta" for Asia/Kolkata.
      const moment = Date.UTC(2026, 0, 15, 12, 0);
      /** @param {string} [timeZone] */
      const wallClock = (timeZone) =>
        new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(
          moment,
        );

      const seen = await page.evaluate(
        (at) =>
          new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) =>
                resolve({
                  language: navigator.language,
                  wallClock: new Intl.DateTimeFormat('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(at),
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }),
              (error) => reject(new Error(error.message)),
            );
          }),
        moment,
      );

      expect(seen).toEqual({
        language: emulation.locale,
        wallClock: wallClock(emulation.timezoneId),
        ...emulation.geolocation,
      });
    });
  });
});
