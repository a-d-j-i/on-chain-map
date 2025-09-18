const config = {
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  bracketSpacing: false,
  plugins: ['prettier-plugin-solidity'],
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      },
    },
    {
      files: '*.sol',
      options: {
        tabWidth: 4,
        singleQuote: false,
      },
    },
  ],
};

export default config;
