// @ts-check
const { toAccountForm } = require('../utils/dataFactory');

/**
 * Account endpoints: createAccount, verifyLogin, updateAccount, deleteAccount and
 * getUserDetailByEmail (APIs 7-14 in the official list).
 */
class AccountApi {
  /** @param {import('./ApiClient').ApiClient} client */
  constructor(client) {
    this.client = client;
  }

  /**
   * Registers a user. Expect responseCode 201 / "User created!".
   * @param {import('../utils/dataFactory').User} user
   */
  createAccount(user) {
    return this.client.post('createAccount', { form: toAccountForm(user) });
  }

  /**
   * Updates every field of an existing user, matched by email + password.
   * @param {import('../utils/dataFactory').User} user
   */
  updateAccount(user) {
    return this.client.put('updateAccount', { form: toAccountForm(user) });
  }

  /**
   * @param {string} email
   * @param {string} password
   */
  deleteAccount(email, password) {
    return this.client.delete('deleteAccount', { form: { email, password } });
  }

  /**
   * Checks credentials. Pass only the fields you want to send so the "missing email" case
   * can be tested too.
   * @param {{ email?: string, password?: string }} credentials
   */
  verifyLogin(credentials) {
    /** @type {Record<string, string>} */
    const form = {};
    if (credentials.email !== undefined) form.email = credentials.email;
    if (credentials.password !== undefined) form.password = credentials.password;
    return this.client.post('verifyLogin', { form });
  }

  /**
   * @param {string} email
   */
  getUserDetailByEmail(email) {
    return this.client.get('getUserDetailByEmail', { params: { email } });
  }
}

module.exports = { AccountApi };
