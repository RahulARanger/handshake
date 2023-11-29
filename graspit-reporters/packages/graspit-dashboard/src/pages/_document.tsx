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

MyDocument.getInitialProps = async (context: DocumentContext) => {
    const initialProperties = await Document.getInitialProps(context);
    return {
        ...initialProperties,
        styles: <>{initialProperties.styles}</>,
    };
};

export default MyDocument;
