import Document, { Html, Head, Main, NextScript } from "next/document";
import React, { type ReactNode } from "react";
import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import type { DocumentContext } from "next/document";

const MyDocument = (): ReactNode => (
    <Html lang="en">
        <Head />
        <body>
            <Main />
            <NextScript />
        </body>
    </Html>
);

Document.getInitialProps = async (ctx: DocumentContext) => {
    const cache = createCache();
    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = async () =>
        await originalRenderPage({
            enhanceApp: (App) => (props) =>
                (
                    <StyleProvider cache={cache}>
                        <App {...props} />
                    </StyleProvider>
                ),
        });

    const initialProps = await Document.getInitialProps(ctx);
    const style = extractStyle(cache, true);
    return {
        ...initialProps,
        styles: (
            <>
                {initialProps.styles}
                <style dangerouslySetInnerHTML={{ __html: style }} />
            </>
        ),
    };
};

export default MyDocument;
