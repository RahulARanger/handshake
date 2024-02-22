import { TEXT } from 'handshake-utils';
import Document, {
    Html,
    Head,
    Main,
    NextScript,
    type DocumentContext,
} from 'next/document';
import type { ReactNode } from 'react';
import React from 'react';

const MyDocument = (): ReactNode => (
    <>
        <Html lang="en">
            <Head title={TEXT.applicationName} />
            <script
                type="text/javascript"
                src="/clarity.js"
                id={`clarity-${process.env.IS_TEST ? 'test' : 'prod'}`}
                async
            />
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    </>
);

MyDocument.getInitialProps = async (context: DocumentContext) => {
    const initialProperties = await Document.getInitialProps(context);
    return {
        ...initialProperties,
        styles: <>{initialProperties.styles}</>,
    };
};

export default MyDocument;
