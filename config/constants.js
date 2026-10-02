// @ts-check

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

module.exports = { MESSAGES, API_MESSAGES, BLOCKED_HOSTS, CONSENT_HOST, PRODUCT_IMAGE_URL };
