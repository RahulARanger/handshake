import React, { type ReactNode } from "react";
import ConfigProvider from "antd/lib/config-provider";
import type { AppProps } from "next/app";
import theme from "@/components/theme";
import "@/styles/globals.css";

const App = ({ Component, pageProps }: AppProps): ReactNode => (
    <ConfigProvider theme={theme}>
        <Component {...pageProps} />
    </ConfigProvider>
);

export default App;
