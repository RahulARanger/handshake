// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import React from 'react';
import { OurApp } from '../src/pages/_app';
import type { Preview } from '@storybook/react';
// import { useEffect } from 'react';
// import { addons } from '@storybook/preview-api';
// import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';
import { useMantineColorScheme } from '@mantine/core';
import { ReactNode } from 'react';

// const channel = addons.getChannel();

function ColorSchemeWrapper({ children }: { children: React.ReactNode }) {
    const { setColorScheme } = useMantineColorScheme();
    setColorScheme('dark');
    // const handleColorScheme = (value: boolean) =>
    //     setColorScheme(value ? 'dark' : 'light');

    // useEffect(() => {
    //     channel.on(DARK_MODE_EVENT_NAME, handleColorScheme);
    //     return () => channel.off(DARK_MODE_EVENT_NAME, handleColorScheme);
    // }, [channel]);

    return <>{children}</>;
}

export const decorators = [
    (renderStory: () => ReactNode) => (
        <ColorSchemeWrapper>{renderStory()}</ColorSchemeWrapper>
    ),
    (renderStory: () => ReactNode) => <OurApp Component={renderStory()} />,
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
