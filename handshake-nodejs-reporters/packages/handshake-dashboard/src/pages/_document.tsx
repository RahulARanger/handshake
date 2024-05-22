import { TEXT } from 'handshake-utils';
import { Html, Head, Main, NextScript } from 'next/document';
// import Script from 'next/script';
import type { ReactNode } from 'react';
import React from 'react';
import { ColorSchemeScript } from '@mantine/core';

export default function Document(): ReactNode {
    return (
        <Html lang="en">
            <Head title={TEXT.applicationName}>
                <ColorSchemeScript defaultColorScheme="auto" />
                {/* <Script
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
                /> */}
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
