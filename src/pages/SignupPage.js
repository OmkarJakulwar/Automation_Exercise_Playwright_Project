// @ts-check
const { BasePage } = require('./BasePage');
const { MESSAGES } = require('../../config/constants');

/**
 * /signup - the "Enter Account Information" form you land on after the first signup step.
 */
class SignupPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/signup');
    this.heading = page.getByRole('heading', { name: MESSAGES.enterAccountInfo });
    this.titleMr = page.getByLabel('Mr.', { exact: true });
    this.titleMrs = page.getByLabel('Mrs.', { exact: true });
    this.name = page.getByTestId('name');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.birthDay = page.getByTestId('days');
    this.birthMonth = page.getByTestId('months');
    this.birthYear = page.getByTestId('years');
    this.newsletter = page.getByLabel('Sign up for our newsletter!');
    this.specialOffers = page.getByLabel('Receive special offers from our partners!');
    this.firstName = page.getByTestId('first_name');
    this.lastName = page.getByTestId('last_name');
    this.company = page.getByTestId('company');
    this.address1 = page.getByTestId('address');
    this.address2 = page.getByTestId('address2');
    this.country = page.getByTestId('country');
    this.state = page.getByTestId('state');
    this.city = page.getByTestId('city');
    this.zipcode = page.getByTestId('zipcode');
    this.mobileNumber = page.getByTestId('mobile_number');
    this.createAccountButton = page.getByTestId('create-account');
  }

  get marker() {
    return this.heading;
  }

  /**
   * Fills the "Enter Account Information" block: title, password, date of birth and the two
   * opt-in checkboxes. Name and email are pre-filled from the previous step.
   * @param {import('../utils/dataFactory').User} user
   * @returns {Promise<void>}
   */
  async fillAccountInformation(user) {
    await (user.title === 'Mr' ? this.titleMr : this.titleMrs).check();
    await this.password.fill(user.password);
    // Mixed selectOption styles on purpose (country below goes by label). Month goes by index:
    // option 0 is the "Month" placeholder, so index N is month N.
    await this.birthDay.selectOption(user.birthDay);
    await this.birthMonth.selectOption({ index: Number(user.birthMonth) });
    await this.birthYear.selectOption({ value: user.birthYear });
    await this.newsletter.check();
    await this.specialOffers.check();
  }

  /**
   * Fills the "Address Information" block.
   * @param {import('../utils/dataFactory').User} user
   * @returns {Promise<void>}
   */
  async fillAddressInformation(user) {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.company.fill(user.company);
    await this.address1.fill(user.address1);
    await this.address2.fill(user.address2);
    await this.country.selectOption({ label: user.country });
    await this.state.fill(user.state);
    await this.city.fill(user.city);
    await this.zipcode.fill(user.zipcode);
    await this.mobileNumber.fill(user.mobileNumber);
  }

  /** @returns {Promise<void>} */
  async submit() {
    await this.createAccountButton.click();
    await this.page.waitForURL('**/account_created');
  }

  /**
   * Fills the whole form and creates the account.
   * @param {import('../utils/dataFactory').User} user
   * @returns {Promise<void>}
   */
  async createAccount(user) {
    await this.fillAccountInformation(user);
    await this.fillAddressInformation(user);
    await this.submit();
  }
}

module.exports = { SignupPage };
