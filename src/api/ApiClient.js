// @ts-check
const { parseJson } = require('../utils/apiResponse');
const { createLogger } = require('../utils/logger');

const log = createLogger('api');

/**
 * @typedef {object} ApiResult
 * @property {number} status - HTTP status. Usually 200 on this site, even for errors.
 * @property {any} body - parsed JSON body
 * @property {number} responseCode - body.responseCode, which is where the real status lives
 * @property {string} [message] - body.message when the API sends one
 * @property {import('@playwright/test').APIResponse} response
 */

/**
 * @typedef {object} RequestOptions
 * @property {Record<string, string | number | boolean>} [params] - query string
 * @property {Record<string, string | number | boolean>} [form] - sent as application/x-www-form-urlencoded
 */

/**
 * Thin wrapper over APIRequestContext. It builds URLs from the API root, sends form data the way
 * this API wants it, and always hands back the parsed body alongside the raw response.
 */
class ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} apiURL - e.g. "https://automationexercise.com/api"
   */
  constructor(request, apiURL) {
    this.request = request;
    this.apiURL = apiURL.replace(/\/$/, '');
  }

  /**
   * @param {string} endpoint - e.g. "productsList"
   * @returns {string}
   */
  url(endpoint) {
    return `${this.apiURL}/${endpoint.replace(/^\//, '')}`;
  }

  /**
   * @param {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} method
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
