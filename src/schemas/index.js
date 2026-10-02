// @ts-check
// Both packages are ES modules compiled to CommonJS; `.default` is what the type definitions expect.
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats').default;

// allErrors so a failing test lists every mismatch at once instead of making us fix them one by one.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schemas = {
  productsList: require('./productsList.schema.json'),
  brandsList: require('./brandsList.schema.json'),
  message: require('./message.schema.json'),
  userDetail: require('./userDetail.schema.json'),
};

/** @typedef {keyof typeof schemas} SchemaName */

for (const schema of Object.values(schemas)) ajv.addSchema(schema);

/**
 * Validates data against one of our schemas.
 * @param {SchemaName} name
 * @param {unknown} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSchema(name, data) {
  const validate = ajv.getSchema(name);
  if (!validate) throw new Error(`No schema registered as "${name}"`);
  const valid = /** @type {boolean} */ (validate(data));
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '(root)'} ${e.message}${e.params ? ` ${JSON.stringify(e.params)}` : ''}`,
  );
  return { valid, errors };
}

module.exports = { validateSchema, schemaNames: Object.keys(schemas) };
