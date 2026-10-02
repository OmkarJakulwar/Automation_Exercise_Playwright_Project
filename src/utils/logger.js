// @ts-check

/** @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel */

/** @type {Record<LogLevel, number>} */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// Quiet by default so the list reporter stays readable. Set LOG_LEVEL=debug when chasing a problem.
const threshold = LEVELS[/** @type {LogLevel} */ (process.env.LOG_LEVEL)] ?? LEVELS.warn;

/**
 * Writes a log line if the level is at or above LOG_LEVEL.
 * @param {LogLevel} level
 * @param {string} scope - short tag for where the message came from, e.g. "api" or "fixtures"
 * @param {string} message
 * @returns {void}
 */
function log(level, scope, message) {
  if (LEVELS[level] < threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} [${scope}] ${message}`;
  // console.error for warnings and errors so they still show up when stdout is piped somewhere.
  (LEVELS[level] >= LEVELS.warn ? console.error : console.log)(line);
}

/**
 * Returns a logger bound to one scope, so call sites don't repeat the tag.
 * @param {string} scope
 */
function createLogger(scope) {
  return {
    /** @param {string} message */
    debug: (message) => log('debug', scope, message),
    /** @param {string} message */
    info: (message) => log('info', scope, message),
    /** @param {string} message */
    warn: (message) => log('warn', scope, message),
    /** @param {string} message */
    error: (message) => log('error', scope, message),
  };
}

module.exports = { createLogger };
