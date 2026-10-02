// @ts-check
const path = require('node:path');

// Text the site shows back to the user. Kept in one place so a copy change on the site is a
// one-line fix here instead of a hunt through every spec.
const MESSAGES = Object.freeze({
  heroTagline: 'Full-Fledged practice website for Automation Engineers',
  loginHeading: 'Login to your account',
  signupHeading: 'New User Signup!',
  enterAccountInfo: 'Enter Account Information',
  accountCreated: 'Account Created!',
  accountDeleted: 'Account Deleted!',
  loginError: 'Your email or password is incorrect!',
  emailExists: 'Email Address already exist!',
  getInTouch: 'Get In Touch',
  contactConfirm: 'Press OK to proceed!',
  contactSuccess: 'Success! Your details have been submitted successfully.',
  subscription: 'Subscription',
  subscribed: 'You have been successfully subscribed!',
  allProducts: 'All Products',
  searchedProducts: 'Searched Products',
  reviewHeading: 'Write Your Review',
  reviewThanks: 'Thank you for your review.',
  recommendedItems: 'recommended items',
  cartEmpty: 'Cart is empty!',
  orderPlaced: 'Order Placed!',
  orderConfirmed: 'Congratulations! Your order has been confirmed!',
});

// What the API puts in body.message. The HTTP status is 200 for all of these - see ApiClient.
const API_MESSAGES = Object.freeze({
  methodNotSupported: 'This request method is not supported.',
  searchParamMissing: 'Bad request, search_product parameter is missing in POST request.',
  loginParamMissing: 'Bad request, email or password parameter is missing in POST request.',
  emailParamMissing: 'Bad request, email parameter is missing in GET request.',
  userExists: 'User exists!',
  userNotFound: 'User not found!',
  userCreated: 'User created!',
  userUpdated: 'User updated!',
  accountDeleted: 'Account deleted!',
  accountNotFound: 'Account not found!',
  emailAlreadyExists: 'Email already exists!',
  detailNotFound: 'Account not found with this email, try another email!',
});

// Hosts that serve ads, tracking and the EU consent banner. Blocking them keeps pages fast and
// stops the full-page "#google_vignette" ad from hijacking navigation mid-test.
const BLOCKED_HOSTS = Object.freeze([
  'googlesyndication.com',
  'doubleclick.net',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'adservice.google.com',
  'adtrafficquality.google',
  'fundingchoicesmessages.google.com',
]);

// The consent banner comes from Funding Choices. It's in BLOCKED_HOSTS above, so normally it
// never loads, but a test can drop it from the list to exercise the locator handler.
const CONSENT_HOST = 'fundingchoicesmessages.google.com';

// Product thumbnails are served one by one from this endpoint and are slow enough to hold the
// page's load event back by 10-20s. See the productImages fixture.
const PRODUCT_IMAGE_URL = '**/get_product_picture/**';

/**
 * What the downloaded invoice says. The amount is the plain number, without "Rs.".
 * @param {string} name
 * @param {number} amount
 * @returns {string}
 */
const invoiceText = (name, amount) => `Hi ${name}, Your total purchase amount is ${amount}. Thank you`;
const INVOICE_FILE_NAME = 'invoice.txt';

// axe rule sets we scan against: WCAG 2.0 and 2.1, levels A and AA.
const WCAG_TAGS = Object.freeze(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

// Written by tests/auth.setup.js, read by tests that reuse the saved login. The folder is
// git-ignored: the user file holds the throwaway account's password.
const AUTH_DIR = path.resolve(__dirname, '../playwright/.auth');
const AUTH_STATE_FILE = path.join(AUTH_DIR, 'user.json');
const AUTH_USER_FILE = path.join(AUTH_DIR, 'user-data.json');

module.exports = {
  MESSAGES,
  API_MESSAGES,
  BLOCKED_HOSTS,
  CONSENT_HOST,
  PRODUCT_IMAGE_URL,
  invoiceText,
  INVOICE_FILE_NAME,
  WCAG_TAGS,
  AUTH_STATE_FILE,
  AUTH_USER_FILE,
};
