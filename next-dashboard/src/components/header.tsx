import { AppBar, Stack, Typography, Tooltip } from "@mui/material";
import React, { Component, type ReactNode } from "react";
import readDateForKey, { fromNow } from "./helper";

export class Header extends Component<{
    children?: ReactNode;
    name: string;
    version: string;
    finishedAt: string;
}> {
    render(): ReactNode {
        const finishedAt = readDateForKey(this.props.finishedAt);
        return (
            <AppBar position="sticky" sx={{ px: "12px", py: "6px" }}>
                <Stack
                    justifyContent={"space-between"}
                    flexDirection="row"
                    display="flex"
                    alignItems="center"
                >
                    <Typography variant="h6" sx={{ letterSpacing: ".2rem" }}>
                        {this.props.name}
                        <sub>
                            <Typography variant="caption">
                                {this.props.version}
                            </Typography>
                        </sub>
                    </Typography>
                    <Stack>
                        {this.props.children ?? <></>}
                        <Tooltip
                            title={finishedAt.toString()}
                            sx={{ alignSelf: "flex-end" }}
                        >
                            <Typography variant="caption">
                                {`Last Updated: ${fromNow(finishedAt)}`}
                            </Typography>
                        </Tooltip>
                    </Stack>
                </Stack>
            </AppBar>
        );
    }
}
