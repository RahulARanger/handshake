import type { StorybookConfig } from '@storybook/nextjs';

import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
// function getAbsolutePath(value: string): string {
//     return dirname(require.resolve(join(value, 'package.json')));
// }
const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@chromatic-com/storybook',
        '@storybook/addon-coverage',
        "@storybook/addon-docs"
    ],
    framework: {
        name: "@storybook/nextjs",
        options: { nextConfigPath: '../next.config.js' },
    },
    docs: {},
    staticDirs: ['../public'],
};
export default config;
