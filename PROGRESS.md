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
- [ ] Hybrid tests (API + UI)
- [ ] Network mocking, route.fulfill/continue/abort, HAR record + replay
- [ ] Multiple contexts, popups/new tab
- [ ] Mobile project tests, geolocation/locale/timezone
- [ ] Custom matcher, expect.poll, toPass
- [ ] Global setup / teardown

## Phase 8 - Visual & accessibility
- [ ] toHaveScreenshot: home, product detail, cart
- [ ] axe scans on key pages

## Phase 9 - Code quality
- [ ] ESLint flat config + playwright plugin + custom rules
- [ ] Prettier, husky + lint-staged
- [ ] Full cross-browser run, `--repeat-each=3` on smoke set
- [ ] Comment style pass over the whole codebase

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
