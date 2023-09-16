import { type ThemeConfig } from "antd/lib/config-provider";
import theme from "antd/lib/theme";
import ConfigProvider from "antd/lib/config-provider";
import React, { type ReactNode } from "react";

const customTheme: ThemeConfig = {
    token: {
        colorPrimary: "#f66a00",
        colorInfo: "#f66a00",
    },
    algorithm: theme.darkAlgorithm,
};

const withTheme = (node: ReactNode): JSX.Element => (
    <>
        <ConfigProvider theme={customTheme} wave={{}}>
            {node}
        </ConfigProvider>
    </>
);

export default withTheme;
