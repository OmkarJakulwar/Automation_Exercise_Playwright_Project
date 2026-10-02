// @ts-check
const { BasePage } = require('./BasePage');
const { MESSAGES } = require('../../config/constants');

/**
 * /login - holds both the "Login to your account" and "New User Signup!" forms.
 */
class LoginSignupPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/login');
    this.loginHeading = page.getByRole('heading', { name: MESSAGES.loginHeading });
    this.loginEmail = page.getByTestId('login-email');
    this.loginPassword = page.getByTestId('login-password');
    this.loginButton = page.getByTestId('login-button');
    this.loginError = page.getByText(MESSAGES.loginError);

    this.signupHeading = page.getByRole('heading', { name: MESSAGES.signupHeading });
    this.signupName = page.getByTestId('signup-name');
    this.signupEmail = page.getByTestId('signup-email');
    this.signupButton = page.getByTestId('signup-button');
    this.signupError = page.getByText(MESSAGES.emailExists);
  }

  get marker() {
    return this.loginHeading;
  }

  /**
   * Fills the login form and submits it. Doesn't wait for a redirect because the failed-login
   * case stays on /login.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  async login(email, password) {
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginButton.click();
  }

  /**
   * Fills name + email in "New User Signup!" and submits, which takes you to the account form.
   * @param {string} name
   * @param {string} email
   * @returns {Promise<void>}
   */
  async startSignup(name, email) {
    await this.signupName.fill(name);
    await this.signupEmail.fill(email);
    await this.signupButton.click();
  }
}

module.exports = { LoginSignupPage };
