const project = 'tsconfig.json'

module.exports = {
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
  ],
  parserOptions: {
    project,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project
      },
    },
  },
  rules: {
    "import/prefer-default-export": "error",
    "import/no-default-export": "off"
  }
};