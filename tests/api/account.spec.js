// @ts-check
const { apiTest: test, expect } = require('../../src/fixtures');
const { API_MESSAGES } = require('../../config/constants');
const { readJson } = require('../../src/utils/fileHelper');
const { buildUser, toUserDetail, uniqueEmail } = require('../../src/utils/dataFactory');

/** @type {{ invalidLogins: { case: string, email: string, password: string }[] }} */
const { invalidLogins } = readJson('users.json');

test.describe('Account API', { tag: '@api' }, () => {
  test.describe('verifyLogin', () => {
    test(
      'API 07 - Verify login with valid details',
      { tag: '@smoke' },
      async ({ accountApi, testUser }) => {
        const { status, responseCode, message } = await accountApi.verifyLogin({
          email: testUser.email,
          password: testUser.password,
        });

        expect(status).toBe(200);
        expect(responseCode).toBe(200);
        expect(message).toBe(API_MESSAGES.userExists);
      },
    );

    test('API 08 - Verify login without email parameter', async ({ accountApi }) => {
      const { status, responseCode, message, body } = await accountApi.verifyLogin({
        password: 'whatever123',
      });

      expect(status).toBe(200);
      expect(responseCode).toBe(400);
      expect(message).toBe(API_MESSAGES.loginParamMissing);
      expect(body).toMatchSchema('message');
    });

    test('API 09 - DELETE to verify login is not supported', async ({ accountApi }) => {
      const { status, responseCode, message } = await accountApi.deleteVerifyLogin();

      expect(status).toBe(200);
      expect(responseCode).toBe(405);
      expect(message).toBe(API_MESSAGES.methodNotSupported);
    });

    for (const login of invalidLogins) {
      test(`API 10 - Verify login with invalid details (${login.case})`, async ({ accountApi }) => {
        const { status, responseCode, message } = await accountApi.verifyLogin(login);

        expect(status).toBe(200);
        expect(responseCode).toBe(404);
        expect(message).toBe(API_MESSAGES.userNotFound);
      });
    }

    test('API 10 - Verify login with a wrong password for a real user', async ({
      accountApi,
      testUser,
    }) => {
      const { responseCode, message } = await accountApi.verifyLogin({
        email: testUser.email,
        password: `${testUser.password}-wrong`,
      });

      expect(responseCode).toBe(404);
      expect(message).toBe(API_MESSAGES.userNotFound);
    });
  });

  test.describe('account lifecycle', () => {
    test(
      'API 11 - Create/register user account',
      { tag: '@smoke' },
      async ({ accountApi, newUser }) => {
        // newUser is only data at this point; its fixture deletes the account after the test.
        const created = await accountApi.createAccount(newUser);

        expect(created.status).toBe(200);
        expect(created.responseCode).toBe(201);
        expect(created.message).toBe(API_MESSAGES.userCreated);

        await test.step('The new account can log in', async () => {
          const { responseCode } = await accountApi.verifyLogin(newUser);
          expect(responseCode).toBe(200);
        });

        await test.step('Registering the same email again is rejected', async () => {
          const duplicate = await accountApi.createAccount(newUser);
          expect(duplicate.responseCode).toBe(400);
          expect(duplicate.message).toBe(API_MESSAGES.emailAlreadyExists);
        });
      },
    );

    test('API 12 - Delete user account', async ({ accountApi, testUser }) => {
      const deleted = await accountApi.deleteAccount(testUser.email, testUser.password);

      expect(deleted.status).toBe(200);
      expect(deleted.responseCode).toBe(200);
      expect(deleted.message).toBe(API_MESSAGES.accountDeleted);

      await test.step('The account is really gone', async () => {
        const { responseCode, message } = await accountApi.verifyLogin(testUser);
        expect(responseCode).toBe(404);
        expect(message).toBe(API_MESSAGES.userNotFound);
      });

      await test.step('Deleting it a second time reports not found', async () => {
        const again = await accountApi.deleteAccount(testUser.email, testUser.password);
        expect(again.responseCode).toBe(404);
        expect(again.message).toBe(API_MESSAGES.accountNotFound);
      });
    });

    test('API 13 - Update user account', async ({ accountApi, testUser }) => {
      // Same email + password identify the account; everything else gets fresh values.
      const updated = buildUser({ email: testUser.email, password: testUser.password });

      const result = await accountApi.updateAccount(updated);

      expect(result.status).toBe(200);
      expect(result.responseCode).toBe(200);
      expect(result.message).toBe(API_MESSAGES.userUpdated);

      await test.step('The stored details reflect the update', async () => {
        const { body } = await accountApi.getUserDetailByEmail(testUser.email);
        const expected = toUserDetail(updated);
        // Soft checks so one run tells us every field that didn't stick, not just the first.
        for (const [field, value] of Object.entries(expected)) {
          expect.soft(body.user[field], `user.${field}`).toBe(value);
        }
      });
    });
  });

  test.describe('getUserDetailByEmail', () => {
    test('API 14 - Get user account detail by email', async ({ accountApi, testUser }) => {
      const { status, responseCode, body } = await accountApi.getUserDetailByEmail(testUser.email);

      expect(status).toBe(200);
      expect(responseCode).toBe(200);
      expect(body).toMatchSchema('userDetail');
      expect(body.user).toMatchObject(toUserDetail(testUser));
    });

    test('API 14 - Get user detail for an unknown email', async ({ accountApi }) => {
      const { responseCode, message } = await accountApi.getUserDetailByEmail(uniqueEmail('ghost'));

      expect(responseCode).toBe(404);
      expect(message).toBe(API_MESSAGES.detailNotFound);
    });

    test('API 14 - Get user detail without email parameter', async ({ accountApi }) => {
      const { responseCode, message } = await accountApi.getUserDetailByEmail();

      expect(responseCode).toBe(400);
      expect(message).toBe(API_MESSAGES.emailParamMissing);
    });
  });
});
