import { type ThemeConfig } from 'antd/lib/config-provider';
import theme from 'antd/lib/theme';
import ConfigProvider from 'antd/lib/config-provider';
import React, { type ReactNode } from 'react';

const withTheme = (node: ReactNode): JSX.Element => {
    // const selectedFont = Roboto({
    //     weight: '300',
    //     subsets: ['latin'],
    // });

    const customTheme: ThemeConfig = {
        token: {
            colorPrimary: '#f66a00',
            colorInfo: '#f66a00',

            // fontFamily: selectedFont.style.fontFamily,
        },
        components: {
            Table: {
                colorBgContainer: 'transparent',
                headerBorderRadius: 10,
                borderRadius: 10,
            },
        },

        algorithm: theme.darkAlgorithm,
    };
    return (
        <>
            <ConfigProvider theme={customTheme}>{node}</ConfigProvider>
        </>
    );
};

export default withTheme;
