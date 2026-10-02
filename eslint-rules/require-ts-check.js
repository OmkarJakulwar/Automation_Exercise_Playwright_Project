// @ts-check

// Every JS file here is type-checked through JSDoc, but tsc only checks a file that opts in, so
// a missing `// @ts-check` means the file silently drops out of `npm run typecheck`.

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'require `// @ts-check` as the first line of the file' },
    fixable: 'code',
    messages: { missing: 'Start the file with `// @ts-check`.' },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const first = context.sourceCode.getAllComments()[0];
        const ok =
          first &&
          first.type === 'Line' &&
          first.value.trim() === '@ts-check' &&
          first.loc?.start.line === 1;
        if (ok) return;
        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: 'missing',
          fix: (fixer) => fixer.insertTextBeforeRange([0, 0], '// @ts-check\n'),
        });
      },
    };
  },
};
