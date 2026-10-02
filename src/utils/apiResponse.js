// @ts-check

/**
 * Reads a response body as JSON whatever the content-type says.
 * Several endpoints on this site return JSON with a text/html header, so response.json() isn't
 * safe to rely on. If the body isn't JSON at all we throw with the raw text, which makes the
 * failure readable in the report instead of a bare "Unexpected token <".
 * @param {import('@playwright/test').APIResponse} response
 * @returns {Promise<any>}
 */
async function parseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON from ${response.url()} (HTTP ${response.status()}) but got:\n${text.slice(0, 500)}`,
    );
  }
}

module.exports = { parseJson };
