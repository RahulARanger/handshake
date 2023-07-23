import { createTheme } from "@mui/material/styles";

// Create a theme instance.
const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#e85403",
        },
        secondary: {
            main: "#ff6d00",
        },
        info: {
            main: "#03a9f4",
        },
        success: {
            main: "#4caf50",
        },
        error: {
            main: "#f71505",
        },
        warning: {
            main: "#ffb300",
        },
    },
});
export default theme;
