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
src/pages/               page objects (BasePage + one class per page)
src/components/          UI parts shared by many pages (header, footer, sidebars)
src/api/                 ApiClient + one class per API area
src/fixtures/index.js    custom `test` and `expect` - always import from here in specs
src/utils/               dataFactory (faker), fileHelper, apiResponse, logger
src/schemas/             JSON schemas for API responses (ajv)
test-data/               static JSON/CSV data + upload files
tests/auth.setup.js      creates a user, logs in once, saves storageState
tests/ui/<area>/         official UI test cases, grouped by feature
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
- Specs import `test` and `expect` from `src/fixtures`, never from `@playwright/test` directly.
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
- Tests are independent and parallel-safe: unique data per test (faker + timestamp) and delete
  created accounts through the API in teardown (the `testUser` fixture does this).
- Test titles: `TC01 - Register User` for official cases. Use `test.step` for each numbered step.
- Tags via the `tag` option: `@smoke`, `@regression`, `@api`, `@visual`, `@a11y`, `@mobile`.
- Arrange / Act / Assert in every test. One feature area per spec file.

## Site quirks we already know about

- Google ads, including full-page "vignette" ads (`#google_vignette` in the URL). An auto fixture
  blocks ad/analytics domains with `page.route()` for every UI test.
- EU consent dialog (we run from Ireland). Dismissed with `page.addLocatorHandler()`.
- The API almost always answers HTTP 200; the real status is `body.responseCode`. Assert both.
- Several endpoints want form data, not JSON - use the `form` option.
- Some JSON responses come back as `text/html`. Parse with the helper in `src/utils/apiResponse.js`.

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
