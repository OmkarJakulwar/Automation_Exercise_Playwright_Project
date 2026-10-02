# CLAUDE.md

Working notes for anyone (human or tool) touching this repo. Read this before writing code.

## What this is

End-to-end test framework for https://automationexercise.com, written in **JavaScript** with
`@playwright/test`. It covers all 26 official UI test cases and all 14 official APIs, and is meant
to show off most of what Playwright can do in a realistic way.

- Official UI steps: `docs/test-cases.md` (copied from https://automationexercise.com/test_cases)
- Official API list: `docs/api-list.md` (copied from https://automationexercise.com/api_list)
- Progress tracker: `PROGRESS.md` — tick items off as they're done.

If the live site behaves differently from the official text, follow the site and leave a short
comment in the test explaining the difference.

## Folder structure

```
config/environments.js   base URLs and settings per env (qa, staging, prod), picked by ENV
config/constants.js      UI messages the site shows + ad/consent hosts we block
src/pages/               page objects (BasePage + one class per page)
src/components/          UI parts shared by many pages (header, footer, sidebars,
                         product grid, "Added!" cart modal)
src/api/                 ApiClient + one class per API area
src/fixtures/index.js    custom `test` and `expect` - always import from here in specs
src/utils/               dataFactory (faker), fileHelper, apiResponse, logger, price,
                         accountLedger (tracks created accounts for global teardown)
src/global/              globalSetup (site health check) and globalTeardown (account sweep)
src/schemas/             JSON schemas for API responses (ajv) - use expect(body).toMatchSchema('name')
test-data/               static JSON/CSV data, upload files, recorded HAR (test-data/har)
tests/auth.setup.js      creates a user, logs in once, saves storageState
tests/auth.teardown.js   deletes that user once all dependent projects finish
tests/ui/<area>/         official UI test cases, grouped by feature
tests/ui/sessions/       new tab and multi-context tests
tests/api/               the 14 API tests
tests/hybrid/            API setup + UI verification
tests/visual/            toHaveScreenshot tests
tests/a11y/              axe scans
tests/mocking/           page.route / HAR examples
tests/mobile/            device emulation tests
docs/                    copies of the official test case / API pages
```

## Commands

```bash
npm test                    # everything
npm run test:chromium       # one browser (fine for day-to-day work)
npm run test:api            # API project only, no browser
npm run test:smoke          # --grep @smoke
npx playwright test tests/ui/auth/register.spec.js --project=chromium
npm run lint                # must pass with zero errors
npm run typecheck           # tsc over the JSDoc types, must pass too
npm run report              # open last HTML report
```

The full script list lives in `package.json` and the README.

## Environment

- Node `>=20.19` (faker v10 is ESM-only and we load it with `require`, which needs 20.19+).
- Copy `.env.example` to `.env`. Never commit `.env`, never hard-code credentials.
- `ENV=qa|staging|prod` picks an entry from `config/environments.js`; `BASE_URL` overrides it.

## Coding rules

- Every JS file starts with `// @ts-check` and uses JSDoc types. Public methods get a one-line
  description plus `@param` / `@returns`.
- CommonJS (`require` / `module.exports`) to match the scaffold.
- In JSDoc, refer to classes from other files as `import('../pages/HomePage').HomePage`.
- `typescript` is pinned to 5.x on purpose: TS 7's native compiler dropped CommonJS export types
  in JSDoc, which breaks `npm run typecheck`. VS Code still uses TS 5 for JS files, so it matches.
- Specs import from `src/fixtures`, never from `@playwright/test` directly:
  - UI / hybrid specs: `const { test, expect } = require('.../src/fixtures')`
  - API specs: `const { apiTest: test, expect } = require('.../src/fixtures')` - this one has
    no browser fixtures, so the api project never starts a browser.
- Fixtures worth knowing: `testUser` (registered via API, deleted after), `newUser` (data only,
  deleted after in case the test registered it), `productCatalog` (worker-scoped),
  `adBlockHosts` (option - override with `test.use()`), `stubProductImages` (option, default on),
  `authUser` (the account behind the saved login - pair with
  `test.use({ storageState: AUTH_STATE_FILE })`).
- `openContext()` gives you another browser context set up like the default one (baseURL, ad
  blocking, image stub). Plain `browser.newContext()` skips all of that.
- Custom matchers: `toMatchSchema(name)` for API bodies, `toHavePrice(n)` for price locators.
- Accounts created outside the `testUser` / `newUser` fixtures must go through `recordCreated()` /
  `recordDeleted()` in `src/utils/accountLedger.js`, so global teardown can sweep leftovers.
- Re-record the HAR with `npm run har:update` if the products page changes.
- Saved login is for read-only tests only. Anything that touches the cart uses its own
  `testUser` / `newUser` (see the cart quirk below).
- Steps shared by several specs in one folder go in a plain `steps.js` next to them (see
  `tests/ui/checkout/steps.js`), still wrapped in `test.step`.
- Page objects:
  - locators defined once (constructor fields or getters), never duplicated across files
  - methods are async and named by user intent (`addProductToCart(name)`, `login(email, pw)`)
  - no assertions inside, except clearly named `verify...` / `expect...` helpers
  - shared UI goes into `src/components` and is composed into pages, not inherited
- Locator priority: `getByTestId` (the site's `data-qa`, configured as `testIdAttribute`) →
  `getByRole` / `getByLabel` / `getByPlaceholder` / `getByText` → CSS/XPath only as a last resort,
  with a comment saying why.
- No magic strings in specs: URLs, messages and data live in `config/` or `test-data/`.
- **Never use `page.waitForTimeout()`.** Use web-first assertions, `waitForResponse`,
  `waitForURL`, `expect.poll` or `toPass`. ESLint enforces this.
- After any click that navigates, wait for the new URL (`waitForURL` waits for `load`). Lots of
  buttons on this site are wired up by jQuery on load; clicking too early silently does nothing
  (search button) or does a native form POST (Contact Us). Header nav methods already do this.
- Tests are independent and parallel-safe: unique data per test (faker + timestamp) and delete
  created accounts through the API in teardown (the `testUser` fixture does this).
- Test titles: `TC01 - Register User` for official cases. Use `test.step` for each numbered step.
- Tags via the `tag` option: `@smoke`, `@regression`, `@api`, `@visual`, `@a11y`, `@mobile`.
- Arrange / Act / Assert in every test. One feature area per spec file.

## Site quirks we already know about

- Google ads, including full-page "vignette" ads (`#google_vignette` in the URL). An auto fixture
  blocks ad/analytics domains with `page.route()` for every UI test.
- Product thumbnails (`/get_product_picture/<id>`) are slow and hold the `load` event back 10-25s.
  An auto fixture swaps them for a 1x1 PNG; visual tests set `test.use({ stubProductImages: false })`.
- EU consent dialog (we run from Ireland). Dismissed with `page.addLocatorHandler()`.
- The API almost always answers HTTP 200; the real status is `body.responseCode`. Assert both.
- Several endpoints want form data, not JSON - use the `form` option.
- API tests: assert `status` (HTTP, always 200), `responseCode` and `message`. Messages live in
  `API_MESSAGES` in config/constants.js. Matchers are added in `src/fixtures/matchers.js`.
- Some JSON responses come back as `text/html`. Parse with the helper in `src/utils/apiResponse.js`.
- Contact Us success writes the message into *every* `.alert-success`, including the hidden one in
  the footer - scope to `#contact-page`.
- Payment: the "Your order has been placed successfully!" alert never shows; the form goes straight
  to `/payment_done/<id>` ("Order Placed!"). We assert on that page.
- Category headings' accessible names start with an icon glyph (" Women"), so match with a regex.
- Product search matches name OR category, so results don't always contain the search term.
- The cart is stored per account, not per session: two logins of the same user see the same cart.
  A guest cart moves into the account on login or signup.
- After a successful login, use `loginAndWaitForHome()` if the next step clicks something on the
  home page - add-to-cart clicks before `load` silently do nothing.
- The invoice is a text file: "Hi <name>, Your total purchase amount is <total>. Thank you".
- A tab opened with Ctrl/Cmd-click starts on about:blank, so `waitForLoadState` returns at once.
  Wait for the real URL (`waitForURL`) instead - `ProductGrid.openProductInNewTab` does.
- Engine differences we hit: Firefox asks for zstd and `route.fetch()` returns it undecoded (set
  `accept-encoding`); WebKit hides Accept-Language from `request.allHeaders()`; Chromium reports
  Asia/Kolkata as "Asia/Calcutta".
- The country dropdown only has 7 values - `COUNTRIES` in `dataFactory.js`.
- The recommended carousel rotates on its own (hover pauses it) and shows "Rs. 1000" as the name of
  product 3. Find carousel items in the cart by product id, not by the card text.
- Some text is uppercased with CSS (brand sidebar, headings). `innerText` returns the uppercased
  version; use `textContent` / `toHaveText` when comparing with data.
- TC18's official text clicks "Dress" but expects "WOMEN - TOPS PRODUCTS". We check the heading
  of whatever we clicked.

## Commenting style

Comments should read like a developer explaining something to the person at the next desk.

Do:
- Explain **why**, not what. The code says what; the comment says why we did it this way, what
  problem it solves, or what breaks without it.
- Plain, direct English. "We", "our", contractions are fine.
- Call out gotchas, workarounds and site quirks honestly.
- Use TODO / NOTE / FIXME / HACK when a real dev would, always with a reason.
- Keep it short - one or two lines. Longer only for genuinely tricky bits (fixtures, auth, CI).
- JSDoc on public methods: one plain sentence, then `@param` and `@returns`.
- `test.step` titles read like the manual test case ("Add the first product to cart").
- In workflow YAML, a short plain comment per job/step.

Don't:
- Comments that repeat the code (`// click the button`, `// import faker`).
- Filler/buzzwords: robust, seamless, leverage, comprehensive, "ensure that", utilize,
  facilitate, "this function is responsible for", "it is important to note".
- Emojis or decorative banners (one short divider is OK in a genuinely long file).
- Over-commenting self-explanatory lines.
- Any mention of code being generated by AI/Claude - in code, commits, README, anywhere.
- Stale comments. If the code changes, fix or delete the comment.

Same tone for commit messages, README, CONTRIBUTING, PR descriptions and release notes.

## Git

- Conventional Commits: `feat:`, `fix:`, `test:`, `chore:`, `ci:`, `docs:`, `refactor:`.
  Short, lowercase after the prefix, no long bodies.
- Work happens phase by phase (see `PROGRESS.md`). After each phase: tests green on Chromium,
  update `PROGRESS.md`, commit, then stop for review.
