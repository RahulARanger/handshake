// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
    // import.meta.dirname is available after Node.js v20.11.0
    baseDirectory: import.meta.dirname,
});

const eslintConfig = [...compat.config({
    extends: [
        'next',
        'plugin:@typescript-eslint/recommended',
        'plugin:unicorn/all',
    ],
    rules: {
        'unicorn/prefer-string-raw': 'off',
    },
    ignorePatterns: [
        'dist/**/*',
        'out/**/*',
        'next-env.d.ts',
        'next.config.js',
    ],
    settings: {
        next: {
            rootDir: 'src',
        },
    },
}), ...storybook.configs["flat/recommended"]];

export default eslintConfig;
