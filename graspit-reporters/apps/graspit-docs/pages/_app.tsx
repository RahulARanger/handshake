import "graspit/src/styles/antd.min.css";
import withTheme from "graspit/src/components/theme";
import type { AppProps } from "next/app";
import React, { type ReactNode } from "react";

export default function MainPage({
	Component,
	pageProps,
}: AppProps): ReactNode {
	return withTheme(<Component {...pageProps} />);
}
