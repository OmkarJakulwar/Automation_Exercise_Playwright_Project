// @ts-check
const { faker } = require('@faker-js/faker');

/**
 * @typedef {object} User
 * @property {'Mr' | 'Mrs'} title
 * @property {string} name - display name, shown as "Logged in as <name>"
 * @property {string} email
 * @property {string} password
 * @property {string} birthDay - "1".."31", matches the <option> values on the signup form
 * @property {string} birthMonth - "1".."12"
 * @property {string} birthYear - "1900".."2021"
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} company
 * @property {string} address1
 * @property {string} address2
 * @property {string} country - must be one of COUNTRIES
 * @property {string} state
 * @property {string} city
 * @property {string} zipcode
 * @property {string} mobileNumber
 */

/**
 * @typedef {object} PaymentCard
 * @property {string} nameOnCard
 * @property {string} cardNumber
 * @property {string} cvc
 * @property {string} expiryMonth - "MM"
 * @property {string} expiryYear - "YYYY"
 */

/**
 * @typedef {object} ContactMessage
 * @property {string} name
 * @property {string} email
 * @property {string} subject
 * @property {string} message
 */

// The signup form only offers these, so anything else would silently fall back to the first option.
const COUNTRIES = Object.freeze([
  'India',
  'United States',
  'Canada',
  'Australia',
  'Israel',
  'New Zealand',
  'Singapore',
]);

/**
 * Makes an email that's unique across parallel workers and repeated runs. The timestamp alone
 * isn't enough when two workers create users in the same millisecond.
 * @param {string} [prefix]
 * @returns {string}
 */
function uniqueEmail(prefix = 'qa') {
  const suffix = faker.string.alphanumeric({ length: 6, casing: 'lower' });
  return `${prefix}.${Date.now()}.${suffix}@example.com`;
}

/**
 * Builds a complete, valid user. Pass overrides for anything a test cares about.
 * @param {Partial<User>} [overrides]
 * @returns {User}
 */
function buildUser(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const dob = faker.date.birthdate({ mode: 'year', min: 1950, max: 2003 });

  return {
    title: faker.helpers.arrayElement(['Mr', 'Mrs']),
    name: `${firstName} ${lastName}`,
    email: uniqueEmail(firstName.toLowerCase().replace(/[^a-z]/g, '') || 'qa'),
    password: faker.internet.password({ length: 12, prefix: 'Aa1!' }),
    birthDay: String(dob.getDate()),
    birthMonth: String(dob.getMonth() + 1),
    birthYear: String(dob.getFullYear()),
    firstName,
    lastName,
    company: faker.company.name(),
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    country: faker.helpers.arrayElement(COUNTRIES),
    state: faker.location.state(),
    city: faker.location.city(),
    zipcode: faker.location.zipCode(),
    // Digits only - the site doesn't validate this, but the address block shows it verbatim
    // and dashes/brackets make the checkout assertions harder to read.
    mobileNumber: faker.string.numeric(10),
    ...overrides,
  };
}

/**
 * Maps a User onto the form field names the createAccount / updateAccount APIs expect.
 * @param {User} user
 * @returns {Record<string, string>}
 */
function toAccountForm(user) {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    title: user.title,
    birth_date: user.birthDay,
    birth_month: user.birthMonth,
    birth_year: user.birthYear,
    firstname: user.firstName,
    lastname: user.lastName,
    company: user.company,
    address1: user.address1,
    address2: user.address2,
    country: user.country,
    zipcode: user.zipcode,
    state: user.state,
    city: user.city,
    mobile_number: user.mobileNumber,
  };
}

/**
 * Builds a fake card. The site doesn't charge anything, so any digits will do.
 * @param {Partial<PaymentCard>} [overrides]
 * @returns {PaymentCard}
 */
function buildPaymentCard(overrides = {}) {
  const expiry = faker.date.future({ years: 4 });
  return {
    nameOnCard: faker.person.fullName(),
    cardNumber: faker.finance.creditCardNumber('visa').replace(/\D/g, ''),
    cvc: faker.finance.creditCardCVV(),
    expiryMonth: String(expiry.getMonth() + 1).padStart(2, '0'),
    expiryYear: String(expiry.getFullYear()),
    ...overrides,
  };
}

/**
 * @param {Partial<ContactMessage>} [overrides]
 * @returns {ContactMessage}
 */
function buildContactMessage(overrides = {}) {
  return {
    name: faker.person.fullName(),
    email: uniqueEmail('contact'),
    subject: faker.lorem.sentence({ min: 3, max: 6 }),
    message: faker.lorem.paragraph(),
    ...overrides,
  };
}

/**
 * @returns {{ name: string, email: string, review: string }}
 */
function buildReview() {
  return {
    name: faker.person.fullName(),
    email: uniqueEmail('review'),
    review: faker.lorem.sentences(2),
  };
}

module.exports = {
  COUNTRIES,
  uniqueEmail,
  buildUser,
  toAccountForm,
  buildPaymentCard,
  buildContactMessage,
  buildReview,
};
