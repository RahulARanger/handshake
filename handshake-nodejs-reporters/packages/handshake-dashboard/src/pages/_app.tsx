import React, { type ReactNode } from 'react';
import type { AppProps } from 'next/app';
import 'styles/globals.css';
import '@mantine/core/styles.css';
import 'react-data-grid/lib/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/carousel/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
    primaryColor: 'orange',
    primaryShade: { dark: 9 },
});

export function OurApp(properties: { Component: ReactNode }): ReactNode {
    return (
        <MantineProvider forceColorScheme="dark" theme={theme}>
            {properties.Component}
        </MantineProvider>
    );
}

export default function App(properties: AppProps): ReactNode {
    return (
        <OurApp
            Component={<properties.Component {...properties.pageProps} />}
        />
    );
}
