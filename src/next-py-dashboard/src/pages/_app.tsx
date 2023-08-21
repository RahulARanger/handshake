import React, { type ReactNode } from "react";
import { type AppProps } from "next/app";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Inter } from "next/font/google";
import theme from "@/components/theme";

const inter = Inter({ subsets: ["latin"] });

export default function MyApp(props: AppProps): ReactNode {
    return (
        <main className={inter.className}>
            <meta
                name="viewport"
                content="initial-scale=1, width=device-width"
            />
            <ThemeProvider theme={theme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                <props.Component {...props.pageProps} />
            </ThemeProvider>
        </main>
    );
}
