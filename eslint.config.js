// @ts-check
const js = require('@eslint/js');
const globals = require('globals');
// The plugin's types only describe its ESM default export; require() hands us the CJS build,
// which is the same object without the `default` wrapper.
const playwright = /** @type {typeof import('eslint-plugin-playwright').default} */ (
  /** @type {unknown} */ (require('eslint-plugin-playwright'))
);
const prettier = require('eslint-config-prettier');
const local = require('./eslint-rules');

module.exports = [
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'allure-results/',
      'allure-report/',
      'playwright/',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    plugins: { local },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'local/require-ts-check': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      // Hard waits are banned everywhere, page objects included, not just in specs.
      'no-restricted-properties': [
        'error',
        {
          property: 'waitForTimeout',
          message: 'Use a web-first assertion, waitForResponse, waitForURL, expect.poll or toPass.',
        },
        { property: 'pause', message: 'page.pause() is for local debugging only.' },
      ],
    },
  },

  {
    // page.evaluate() callbacks run in the browser, so window/document are fine in these files.
    files: ['src/pages/**/*.js', 'src/components/**/*.js', 'tests/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },

  {
    files: ['tests/**/*.js'],
    ...playwright.configs['flat/recommended'],
    settings: {
      // auth.setup.js / auth.teardown.js rename `test` to `setup` / `teardown`.
      playwright: { globalAliases: { test: ['setup', 'teardown'] } },
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Specs get test/expect from our fixtures, otherwise they lose the page objects, the ad
      // blocker and the custom matchers without any error to say so.
      'no-restricted-imports': 'off',
      'no-restricted-modules': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message: "Import { test, expect } from 'src/fixtures' instead.",
            },
          ],
        },
      ],
      // no-restricted-properties above already bans waitForTimeout everywhere.
      'playwright/no-wait-for-timeout': 'off',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/no-focused-test': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/prefer-to-have-count': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      // Page objects have their own assertion helpers (expectLoaded, verify...), and steps.js
      // helpers assert too. Count those as assertions.
      'playwright/expect-expect': [
        'error',
        { assertFunctionPatterns: ['^expect', '\\.expect\\w*$', '\\.verify\\w*$', '^verify'] },
      ],
    },
  },

  // Turns off the formatting rules that would fight Prettier. Has to stay last.
  prettier,
];
