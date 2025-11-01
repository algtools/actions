module.exports = {
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  overrides: [
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
        tabWidth: 2,
        printWidth: 100,
      },
    },
  ],
};
