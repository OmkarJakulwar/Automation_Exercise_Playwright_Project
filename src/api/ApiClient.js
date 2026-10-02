// @ts-check
const { parseJson } = require('../utils/apiResponse');
const { createLogger } = require('../utils/logger');

const log = createLogger('api');

/**
 * @typedef {object} ApiResult
 * @property {number} status - HTTP status. Usually 200 on this site, even for errors.
 * @property {Record<string, any>} body - parsed JSON body. Typed as an object rather than `any`
 *   because Playwright hides custom matchers like toMatchSchema from `any` values.
 * @property {number} responseCode - body.responseCode, which is where the real status lives
 * @property {string} [message] - body.message when the API sends one
 * @property {import('@playwright/test').APIResponse} response
 */

/**
 * @typedef {object} RequestOptions
 * @property {Record<string, string | number | boolean>} [params] - query string
 * @property {Record<string, string | number | boolean>} [form] - sent as application/x-www-form-urlencoded
 */

/** @typedef {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} HttpMethod */

// Anything we attach to the report goes through this so passwords don't end up in HTML reports
// or CI artifacts, even fake ones.
const SECRET_FIELDS = ['password'];

/**
 * @param {Record<string, unknown> | undefined} data
 * @returns {Record<string, unknown> | undefined}
 */
function mask(data) {
  if (!data) return data;
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, SECRET_FIELDS.includes(key) ? '***' : value]),
  );
}

/**
 * Thin wrapper over APIRequestContext. It builds URLs from the API root, sends form data the way
 * this API wants it, and always hands back the parsed body alongside the raw response.
 * When it's given a TestInfo, every call is attached to the report so a failing API test shows
 * exactly what went over the wire.
 */
class ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} apiURL - e.g. "https://automationexercise.com/api"
   * @param {import('@playwright/test').TestInfo} [testInfo] - pass it to get report attachments
   */
  constructor(request, apiURL, testInfo) {
    this.request = request;
    this.apiURL = apiURL.replace(/\/$/, '');
    this.testInfo = testInfo;
  }

  /**
   * @param {string} endpoint - e.g. "productsList"
   * @returns {string}
   */
  url(endpoint) {
    return `${this.apiURL}/${endpoint.replace(/^\//, '')}`;
  }

  /**
   * @param {HttpMethod} method
   * @param {string} endpoint
   * @param {RequestOptions} [options]
   * @returns {Promise<ApiResult>}
   */
  async send(method, endpoint, options = {}) {
    const url = this.url(endpoint);
    const response = await this.request.fetch(url, {
      method,
      params: options.params,
      form: options.form,
    });
    const body = await parseJson(response);
    log.debug(`${method} ${url} -> HTTP ${response.status()}, responseCode ${body?.responseCode}`);

    if (this.testInfo) {
      await this.testInfo.attach(`${method} ${endpoint}`, {
        contentType: 'application/json',
        body: JSON.stringify(
          {
            request: { method, url, params: options.params, form: mask(options.form) },
            response: { status: response.status(), body },
          },
          null,
          2,
        ),
      });
    }

    return {
      status: response.status(),
      body,
      responseCode: body?.responseCode,
      message: body?.message,
      response,
    };
  }

  /**
   * @param {string} endpoint
   * @param {RequestOptions} [options]
   */
  get(endpoint, options) {
    return this.send('GET', endpoint, options);
  }

  /**
   * @param {string} endpoint
   * @param {RequestOptions} [options]
   */
  post(endpoint, options) {
    return this.send('POST', endpoint, options);
  }

  /**
   * @param {string} endpoint
   * @param {RequestOptions} [options]
   */
  put(endpoint, options) {
    return this.send('PUT', endpoint, options);
  }

  /**
   * @param {string} endpoint
   * @param {RequestOptions} [options]
   */
  delete(endpoint, options) {
    return this.send('DELETE', endpoint, options);
  }
}

module.exports = { ApiClient };
