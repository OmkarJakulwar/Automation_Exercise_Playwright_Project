// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('csv-parse/sync');

const ROOT = path.resolve(__dirname, '../..');
const TEST_DATA_DIR = path.join(ROOT, 'test-data');

/**
 * Builds an absolute path inside test-data/.
 * @param {...string} parts - path segments relative to test-data
 * @returns {string}
 */
function testDataPath(...parts) {
  return path.join(TEST_DATA_DIR, ...parts);
}

/**
 * Loads a JSON file from test-data/.
 * @template T
 * @param {string} fileName - e.g. "products.json"
 * @returns {T}
 */
function readJson(fileName) {
  return JSON.parse(fs.readFileSync(testDataPath(fileName), 'utf8'));
}

/**
 * Loads a CSV file from test-data/ as an array of row objects keyed by the header line.
 * @param {string} fileName - e.g. "searchTerms.csv"
 * @returns {Record<string, string>[]}
 */
function readCsv(fileName) {
  return parse(fs.readFileSync(testDataPath(fileName), 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    // Lets us leave notes in the CSV without them turning into test rows.
    comment: '#',
  });
}

/**
 * Where a test should save downloads. We use the test's own output folder so files get cleaned
 * up with the rest of test-results and never collide between parallel workers.
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} fileName
 * @returns {string}
 */
function downloadPath(testInfo, fileName) {
  return testInfo.outputPath('downloads', fileName);
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = { ROOT, testDataPath, readJson, readCsv, downloadPath, fileExists };
