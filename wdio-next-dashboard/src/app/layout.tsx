"use client";

import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import createTheme from "@mui/material/styles/createTheme";
import CssBaseline from "@mui/material/CssBaseline";
import React, { type ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Wdio Next Dashboard",
    description: "Dashboard for displaying the test results in nextjs way",
};

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#e85403",
        },
        secondary: {
            main: "#ff6d00",
        },
        info: {
            main: "#03a9f4",
        },
        success: {
            main: "#4caf50",
        },
        error: {
            main: "#f71505",
        },
        warning: {
            main: "#ffb300",
        },
    },
});

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}): ReactNode {
    return (
        <html lang="en">
            <meta
                name="viewport"
                content="initial-scale=1, width=device-width"
            />
            <body className={inter.className}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
