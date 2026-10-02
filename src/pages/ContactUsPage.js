// @ts-check
const { BasePage } = require('./BasePage');
const { MESSAGES } = require('../../config/constants');

class ContactUsPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/contact_us');
    this.heading = page.getByRole('heading', { name: MESSAGES.getInTouch });
    this.name = page.getByTestId('name');
    this.email = page.getByTestId('email');
    this.subject = page.getByTestId('subject');
    this.message = page.getByTestId('message');
    // The file input has no label, placeholder or data-qa - name attribute is all there is.
    this.fileInput = page.locator('input[name="upload_file"]');
    this.submitButton = page.getByTestId('submit-button');
    // Scoped to the contact area because the site's JS writes the same text into every
    // .alert-success on the page, including the hidden one in the footer.
    this.successMessage = page.locator('#contact-page').getByText(MESSAGES.contactSuccess);
    // After submit the site swaps the form out for a "Home" button in the same wrapper.
    // Scoping to it keeps the button apart from the header's Home link.
    this.formSection = page.locator('#form-section');
    this.homeButton = this.formSection.getByRole('link', { name: 'Home' });
  }

  get marker() {
    return this.heading;
  }

  /**
   * Fills the contact form and attaches a file. Doesn't submit.
   * @param {import('../utils/dataFactory').ContactMessage} data
   * @param {string} [filePath] - absolute path of a file to upload
   * @returns {Promise<void>}
   */
  async fillForm(data, filePath) {
    await this.name.fill(data.name);
    await this.email.fill(data.email);
    await this.subject.fill(data.subject);
    await this.message.fill(data.message);
    if (filePath) await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Submits the form and accepts the "Press OK to proceed!" confirm() the site throws up.
   * The listener has to be registered before the click, otherwise Playwright auto-dismisses
   * the dialog and the form never posts.
   * @returns {Promise<string>} the dialog's message, so tests can assert on it
   */
  async submit() {
    /** @type {string} */
    let dialogMessage = '';
    this.page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    // The submit handler is attached by jQuery on page load. Clicking before that makes the
    // browser do a plain form POST, the page reloads empty and no success message ever shows.
    await this.page.waitForLoadState('load');
    await this.submitButton.click();
    await this.successMessage.waitFor({ state: 'visible' });
    return dialogMessage;
  }

  /** @returns {Promise<void>} */
  async goHome() {
    await this.homeButton.click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }
}

module.exports = { ContactUsPage };
