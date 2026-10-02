// @ts-check
const { test, expect } = require('../../../src/fixtures');
const { readJson } = require('../../../src/utils/fileHelper');
const { formatPrice, parsePrice } = require('../../../src/utils/price');

/**
 * @type {{
 *   cartPair: { id: number, name: string, price: number }[],
 *   quantityCheck: { name: string, quantity: number },
 * }}
 */
const { cartPair, quantityCheck } = readJson('products.json');

test.describe('Cart', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await homePage.expectLoaded();
  });

  test('TC12 - Add Products in Cart', { tag: ['@smoke', '@regression'] }, async ({ homePage, productsPage, cartPage }) => {
    const { grid } = productsPage;

    await test.step("Click 'Products'", async () => {
      await homePage.header.goToProducts();
      await productsPage.expectLoaded();
    });

    /** @type {import('../../../src/components/ProductGrid').ProductCardInfo[]} */
    const added = [];

    await test.step("Hover over the first product, click 'Add to cart', then 'Continue Shopping'", async () => {
      added.push(await grid.addProductToCartByIndex(0));
      await grid.cartModal.continueShopping();
    });

    await test.step("Hover over the second product, click 'Add to cart', then 'View Cart'", async () => {
      added.push(await grid.addProductToCartByIndex(1));
      await grid.cartModal.viewCart();
    });

    await test.step('Check both products are in the cart with the right price, quantity and total', async () => {
      // The first two cards are fixed on this site; products.json pins them so a reordering
      // shows up here rather than as a vague cart mismatch.
      expect(added.map((p) => p.name)).toEqual(cartPair.map((p) => p.name));

      await expect(cartPage.rows).toHaveCount(added.length);
      for (const product of added) {
        const item = await cartPage.readRow(cartPage.row(product.name));
        expect(item).toMatchObject({
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
        });
      }
    });
  });

  test('TC13 - Verify Product quantity in Cart', { tag: '@regression' }, async ({ homePage, productDetailPage, cartPage }) => {
    await test.step("Click 'View Product' on a product on the home page", async () => {
      await homePage.products.viewProduct(quantityCheck.name);
      await productDetailPage.expectLoaded();
      await expect(productDetailPage.name).toHaveText(quantityCheck.name);
    });

    await test.step(`Increase the quantity to ${quantityCheck.quantity} and click 'Add to cart'`, async () => {
      await productDetailPage.setQuantity(quantityCheck.quantity);
      await expect(productDetailPage.quantity).toHaveValue(String(quantityCheck.quantity));
      await productDetailPage.addToCart();
    });

    await test.step("Click 'View Cart' and check the product has that exact quantity", async () => {
      await productDetailPage.cartModal.viewCart();
      await expect(cartPage.rows).toHaveCount(1);

      const item = await cartPage.readRow(cartPage.row(quantityCheck.name));
      expect(item.quantity).toBe(quantityCheck.quantity);
      expect(item.total).toBe(formatPrice(parsePrice(item.price) * quantityCheck.quantity));
    });
  });

  test('TC17 - Remove Products From Cart', { tag: '@regression' }, async ({ homePage, cartPage }) => {
    /** @type {string[]} */
    const names = [];

    await test.step('Add products to the cart', async () => {
      names.push((await homePage.products.addProductToCartByIndex(0)).name);
      await homePage.products.cartModal.continueShopping();
      names.push((await homePage.products.addProductToCartByIndex(1)).name);
      await homePage.products.cartModal.continueShopping();
    });

    await test.step("Click 'Cart' and check the cart page is shown", async () => {
      await homePage.header.goToCart();
      await cartPage.expectLoaded();
      await expect(cartPage.rows).toHaveCount(names.length);
    });

    const [removed, kept] = names;

    await test.step(`Click 'X' next to '${removed}' and check it's gone`, async () => {
      await cartPage.removeProduct(removed);
      await expect(cartPage.row(removed)).toHaveCount(0);
      await expect(cartPage.row(kept)).toBeVisible();
    });

    await test.step('Remove the last product and check the cart is empty', async () => {
      await cartPage.removeProduct(kept);
      await expect(cartPage.emptyCartMessage).toBeVisible();
    });
  });

  test(
    'TC22 - Add to cart from Recommended items',
    { tag: '@regression' },
    async ({ homePage, cartPage, productCatalog }) => {
      await test.step("Scroll to the bottom and check 'Recommended Items' is visible", async () => {
        await homePage.scrollToRecommended();
        await expect(homePage.recommendedHeading).toBeInViewport();
      });

      /** @type {import('../../../src/components/ProductGrid').AddedProduct | undefined} */
      let added;

      await test.step("Click 'Add To Cart' on a recommended product", async () => {
        added = await homePage.recommended.addFirstVisibleProductToCart();
      });

      await test.step("Click 'View Cart' and check the product is in the cart", async () => {
        await homePage.recommended.cartModal.viewCart();

        // Look the name up by id: the carousel card for product 3 shows its price as the name.
        const expected = productCatalog.find((p) => p.id === added?.id);
        if (!expected) throw new Error(`Product id ${added?.id} isn't in the catalogue`);
        await expect(cartPage.rows).toHaveCount(1);
        await expect(cartPage.row(expected.name)).toBeVisible();
      });
    },
  );
});
