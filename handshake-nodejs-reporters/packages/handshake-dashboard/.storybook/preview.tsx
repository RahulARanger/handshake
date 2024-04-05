// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import React from 'react';
import { OurApp } from '../src/pages/_app';
import type { Preview } from '@storybook/react';

export const decorators = [
    (renderStory: any) => <OurApp Component={renderStory()} />,
];

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
