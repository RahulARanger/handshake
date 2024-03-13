import { TEXT } from 'handshake-utils';
import Document, {
    Html,
    Head,
    Main,
    NextScript,
    type DocumentContext,
} from 'next/document';
import Script from 'next/script';
import type { ReactNode } from 'react';
import React from 'react';

const MyDocument = (): ReactNode => (
    <>
        <Html lang="en">
            <Head title={TEXT.applicationName}>
                <Script
                    id={`clarity-${process.env.IS_TEST ? 'test' : 'prod'}`}
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${process.env.CLARITY}");`,
                    }}
                />
            </Head>
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
