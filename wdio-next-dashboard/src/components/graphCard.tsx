import React, { type ReactNode } from "react";
import { Paper, type SxProps } from "@mui/material";
import GraphCardStyles from "../styles/GraphCard.module.css";

export default function GraphCard({
    children,
    sx,
}: {
    children: ReactNode;
    sx: SxProps;
}): ReactNode {
    return (
        <Paper
            elevation={3}
            className={GraphCardStyles.graphCard}
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                ...sx,
            }}
        >
            {children}
        </Paper>
    );
}
