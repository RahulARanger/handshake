/* eslint-disable unicorn/no-keyword-prefix */
import React, { type ReactNode } from 'react';
import type { AppProps } from 'next/app';
import 'styles/globals.css';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/carousel/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(utc);

const className = 'mirror';
const defaultBg = 'transparent';

const theme = createTheme({
    primaryColor: 'orange',
    primaryShade: { dark: 9 },
    components: {
        Paper: {
            defaultProps: {
                className: className,
            },
        },
        Card: {
            defaultProps: {
                className: className,
            },
        },
        Box: {
            defaultProps: {
                className: className,
            },
        },
        Select: {
            styles: {
                input: {
                    backgroundColor: defaultBg,
                },
            },
            classNames: {
                dropdown: className,
            },
        },
        MultiSelect: {
            styles: {
                input: {
                    backgroundColor: defaultBg,
                },
            },
            classNames: {
                dropdown: className,
            },
        },
        Switch: {
            styles: {
                track: {
                    backgroundColor: defaultBg,
                },
                label: {
                    backgroundColor: defaultBg,
                },
            },
        },
        ActionIcon: {
            defaultProps: {
                className: className,
            },
        },
        Button: {
            defaultProps: {
                className: className,
            },
        },
        MenuDropdown: {
            defaultProps: {
                className: className,
            },
        },
        Modal: {
            styles: {
                backgroundColor: defaultBg,
            },
        },
    },
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
