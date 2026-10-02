// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./fileHelper');

// Every account a run creates gets a line here, and another when it's deleted. Fixtures always
// delete their users, but a worker that's killed (timeout, Ctrl+C, crash) never runs teardown,
// so global teardown reads this file and deletes whatever is left over.
//
// One JSON object per line, appended with appendFileSync: parallel workers each write whole short
// lines, so they don't interleave. Lives in a git-ignored folder because it holds the throwaway
// accounts' passwords until the run ends.
const LEDGER_FILE = path.join(ROOT, 'playwright', '.state', 'accounts.jsonl');

/** @typedef {{ event: 'created', email: string, password: string } | { event: 'deleted', email: string }} LedgerEntry */

/**
 * @param {LedgerEntry} entry
 */
function append(entry) {
  fs.mkdirSync(path.dirname(LEDGER_FILE), { recursive: true });
  fs.appendFileSync(LEDGER_FILE, `${JSON.stringify(entry)}\n`);
}

/**
 * Notes an account that exists (or might, for UI sign-ups that haven't happened yet).
 * @param {{ email: string, password: string }} user
 * @returns {void}
 */
function recordCreated({ email, password }) {
  append({ event: 'created', email, password });
}

/**
 * Notes that an account is gone, so global teardown leaves it alone.
 * @param {string} email
 * @returns {void}
 */
function recordDeleted(email) {
  append({ event: 'deleted', email });
}

/**
 * Accounts that were created and never marked deleted.
 * @returns {{ email: string, password: string }[]}
 */
function leftoverAccounts() {
  if (!fs.existsSync(LEDGER_FILE)) return [];
  /** @type {Map<string, string>} */
  const open = new Map();
  for (const line of fs.readFileSync(LEDGER_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    /** @type {LedgerEntry} */
    const entry = JSON.parse(line);
    if (entry.event === 'created') open.set(entry.email, entry.password);
    else open.delete(entry.email);
  }
  return [...open].map(([email, password]) => ({ email, password }));
}

/**
 * Starts a fresh ledger for a new run.
 * @returns {void}
 */
function resetLedger() {
  fs.rmSync(LEDGER_FILE, { force: true });
}

module.exports = { LEDGER_FILE, recordCreated, recordDeleted, leftoverAccounts, resetLedger };
