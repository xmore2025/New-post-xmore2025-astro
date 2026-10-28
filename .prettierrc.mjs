/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  tabWidth: 2,
  singleQuote: true,
  semi: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
  plugins: ['prettier-plugin-astro'],
};
