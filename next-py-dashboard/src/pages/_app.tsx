import React, { type ReactNode } from "react";
import type { AppProps } from "next/app";
import withTheme from "@/components/theme";
import "@/styles/globals.css";
import "../../public/antd.min.css";

const App = ({ Component, pageProps }: AppProps): ReactNode =>
    withTheme(<Component {...pageProps} />);

export default App;
