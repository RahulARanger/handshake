import React, { type ReactNode } from 'react';
import type { AppProps } from 'next/app';
import withTheme from 'src/components/theme';
import 'src/styles/globals.css';

const App = ({ Component, pageProps }: AppProps): ReactNode => {
    return withTheme(<Component {...pageProps} />);
};

export default App;
