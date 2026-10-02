// @ts-check

/**
 * Turns a price as the site shows it ("Rs. 1000") into a number.
 * @param {string} text
 * @returns {number}
 */
function parsePrice(text) {
  const value = Number(text.replace(/[^\d]/g, ''));
  if (!text.trim() || Number.isNaN(value)) throw new Error(`Not a price: "${text}"`);
  return value;
}

/**
 * Formats a number the way the site prints prices.
 * @param {number} value
 * @returns {string}
 */
function formatPrice(value) {
  return `Rs. ${value}`;
}

module.exports = { parsePrice, formatPrice };
