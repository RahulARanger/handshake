import { type ThemeConfig } from "antd/lib/config-provider";
import theme from "antd/lib/theme";

const customTheme: ThemeConfig = {
    token: {
        colorPrimary: "#f66a00",
        colorInfo: "#f66a00",
    },
    algorithm: theme.darkAlgorithm,
};

export default customTheme;
