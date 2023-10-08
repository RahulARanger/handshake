import "graspit/src/styles/antd.min.css";
import withTheme from "graspit/src/components/theme";
import type { AppProps } from "next/app";

export default function Nextra({ Component, pageProps }: AppProps) {
	return withTheme(<Component {...pageProps} />);
}
