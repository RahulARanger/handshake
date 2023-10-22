import React, { useState, type ReactNode } from 'react';
import type { AppProps } from 'next/app';
import withTheme from 'src/components/theme';
import 'src/styles/globals.css';
import Router from 'next/router';
import Skeleton from 'antd/lib/skeleton/Skeleton';

const App = ({ Component, pageProps }: AppProps): ReactNode => {
    const [active, setActive] = useState<boolean>(false);
    Router.events.on('routeChangeStart', () => setActive(true));
    Router.events.on('routeChangeComplete', () => setActive(false));
    Router.events.on('routeChangeError', () => setActive(false));

    return withTheme(
        <Skeleton
            active={active}
            loading={active}
            style={{ margin: '12px', marginTop: '23px' }}
            paragraph
            round
            title
        >
            <Component {...pageProps} />
        </Skeleton>,
    );
};

export default App;
