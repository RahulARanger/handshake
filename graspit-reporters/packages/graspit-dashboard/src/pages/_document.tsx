import Document, {
    Html,
    Head,
    Main,
    NextScript,
    type DocumentContext,
} from 'next/document';
import React, { type ReactNode } from 'react';

const MyDocument = (): ReactNode => (
    <Html lang="en">
        <Head />
        <body>
            <Main />
            <NextScript />
        </body>
    </Html>
);

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
    const initialProps = await Document.getInitialProps(ctx);
    return {
        ...initialProps,
        styles: <>{initialProps.styles}</>,
    };
};

export default MyDocument;
