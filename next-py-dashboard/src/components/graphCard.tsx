import React, { type ReactNode } from "react";
import { Paper, type SxProps } from "@mui/material";
import GraphCardStyles from "../styles/GraphCard.module.css";

export default function GraphCard({
    children,
    sx,
    className,
}: {
    children: ReactNode;
    sx?: SxProps;
    className?: string;
}): ReactNode {
    return (
        <Paper
            elevation={3}
            className={GraphCardStyles.graphCard + " " + (className ?? "")}
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                ...(sx ?? {}),
            }}
        >
            {children}
        </Paper>
    );
}
