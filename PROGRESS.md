# Progress

Tick items off as they land. Each phase ends with green tests on Chromium, a commit, and a review stop.

## Phase 0 - Setup

- [x] Read /test_cases (26 cases) and /api_list (14 APIs), saved copies in `docs/`
- [x] Scaffold with `npm init playwright@latest` (JS, GitHub Actions workflow, browsers installed)
- [x] Install dependencies (dotenv, faker, axe, allure, eslint, prettier, husky, lint-staged, csv-parse, ajv)
- [x] Folder structure
- [x] `.gitignore`, `.env.example`
- [x] `CLAUDE.md`, `PROGRESS.md`
- [x] `git init` + first commit

## Phase 1 - Configuration

- [x] `playwright.config.js` (baseURL from env, `testIdAttribute: 'data-qa'`, timeouts, retries, workers, reporters, trace/screenshot/video)
- [x] Projects: setup, chromium, firefox, webkit, mobile-chrome, mobile-safari, api (no browser)
- [x] `config/environments.js` + dotenv loading
- [x] npm scripts

## Phase 2 - Core framework

- [x] BasePage + components (Header, Footer, CategorySidebar, BrandSidebar)
- [x] All page objects
- [x] Fixtures: page objects, adBlocker (auto), consent handler, apiClient, testUser, worker-scoped example
- [x] dataFactory (faker) + test-data files
- [x] Smoke test TC01 passing
- [x] `npm run typecheck` (tsc over JSDoc, strict) - zero errors

## Phase 3 - API layer and API tests

- [x] ApiClient, ProductsApi, BrandsApi, AccountApi
- [x] JSON schemas (ajv)
- [x] API 1-14 tests (23 tests incl. data-driven search + invalid logins, extra negatives)
- [x] `toMatchSchema` custom matcher, every API call attached to the report (passwords masked)

## Phase 4 - UI: auth & misc

- [x] TC01 Register User
- [x] TC02 Login with correct credentials
- [x] TC03 Login with incorrect credentials (data-driven from `users.json`)
- [x] TC04 Logout
- [x] TC05 Register with existing email
- [x] TC06 Contact Us form
- [x] TC07 Test Cases page
- [x] TC10 Subscription on home page
- [x] TC11 Subscription on cart page
- [x] TC25 Scroll up using arrow
- [x] TC26 Scroll up without arrow
- [x] Product images stubbed by default (`stubProductImages` option) - real ones held `load` back 10-25s

## Phase 5 - UI: products & cart

- [x] TC08 All products & product detail
- [x] TC09 Search product (+ CSV data-driven, expected results from the search API)
- [x] TC12 Add products to cart
- [x] TC13 Product quantity in cart
- [x] TC17 Remove products from cart
- [x] TC18 Category products (+ JSON loop, checked against the product catalogue)
- [x] TC19 Brand products (+ JSON loop, checked against the product catalogue)
- [x] TC20 Search products and verify cart after login
- [x] TC21 Add review on product
- [x] TC22 Add to cart from recommended items

## Phase 6 - UI: checkout

- [x] `tests/auth.setup.js` + storageState, `auth.teardown.js` deletes the account (project teardown)
- [x] Saved-session spec (read-only, since the cart is per account)
- [x] TC14 Place order: register while checkout
- [x] TC15 Place order: register before checkout
- [x] TC16 Place order: login before checkout
- [x] TC23 Address details in checkout
- [x] TC24 Download invoice

## Phase 7 - Advanced features

- [x] Hybrid tests (API + UI): API user → UI login, UI signup → API details, API rename → UI header, API delete → UI login refused, product pages vs catalogue
- [x] Network mocking: route.fulfill (500 on add-to-cart), route.fetch + patched HTML, route.continue (rewritten search), route.abort (images/fonts), request inspection, offline mode
- [x] HAR record + replay (`npm run har:update`, `test-data/har/products.har`)
- [x] Multiple contexts (`openContext` fixture, two shoppers), new tab via Ctrl/Cmd-click
- [x] Mobile project tests (layout, taps), geolocation / locale / timezone emulation
- [x] Custom matcher `toHavePrice`, expect.poll, toPass
- [x] Global setup (site health check) / teardown (sweeps leftover accounts from the ledger)

## Phase 8 - Visual & accessibility

- [x] toHaveScreenshot: home (first screen, carousel masked), product detail, cart - real images, darwin baselines (Linux ones come with the Phase 12 Docker job)
- [x] axe scans on 7 pages + header and login/signup forms, with a known-issues list per scan (`test-data/a11y.json`), `makeAxeBuilder` fixture

## Phase 9 - Code quality

- [x] ESLint flat config + playwright plugin + custom rules (`local/require-ts-check`, specs can't import `@playwright/test`, `waitForTimeout` / `pause` banned everywhere), zero warnings
- [x] Prettier, husky + lint-staged (pre-commit lints and formats staged files)
- [x] Full cross-browser run (229 tests: 223 passed first time; 5 WebKit timeouts passed on rerun, Firefox TC26 fixed - wheel scroll is capped), `--repeat-each=3` on smoke set (47/47)
- [x] Comment style pass over the whole codebase (banned words, emojis, banners, missing JSDoc descriptions)

## Phase 10 - Reporting

- [ ] HTML + JUnit + Allure, scripts to generate/open Allure

## Phase 11 - GitHub repository

- [ ] Public repo via `gh`, description and topics

## Phase 12 - CI/CD

- [ ] `playwright.yml` (lint, sharded tests, merge reports, deploy to Pages)
- [ ] `nightly.yml`
- [ ] Docker job for visual tests
- [ ] Pipeline green on main

## Phase 13 - Documentation

- [ ] README (diagram, feature table, how-tos, badges)
- [ ] CONTRIBUTING.md
- [ ] v1.0.0 tag + GitHub release
