import React, { type ReactNode } from 'react';
import type { AppProps } from 'next/app';
import 'styles/globals.css';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
    primaryColor: 'orange',
});

export const OurApp = ({ Component }: { Component: ReactNode }): ReactNode => {
    return (
        <MantineProvider defaultColorScheme="dark" theme={theme}>
            {Component}
        </MantineProvider>
    );
};

const App = ({ Component, pageProps }: AppProps): ReactNode => {
    return <OurApp Component={<Component {...pageProps} />} />;
};

export default App;
