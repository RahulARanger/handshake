import { AppBar, Stack, Typography, Skeleton, Tooltip } from "@mui/material";
import React, { Component, type ReactNode } from "react";
import { AskTestResult } from "./askThings";
import readDateForKey, { fromNow } from "./helper";

function HeaderWithAppConfig(props: {
    file: string;
    children: ReactNode;
}): ReactNode {
    const { data, isLoading } = AskTestResult(props.file);
    if (isLoading || data === undefined)
        return (
            <Skeleton
                animation="wave"
                variant="rounded"
                width={250}
                height={30}
            />
        );

    const finishedAt = readDateForKey(data.finished);
    // const startedAt = readDateForKey(data.started);

    return (
        <>
            <Typography variant="h6" sx={{ letterSpacing: ".2rem" }}>
                {data.name}
                <sub>
                    <Typography variant="caption">{data.version}</Typography>
                </sub>
            </Typography>
            <Stack>
                {props.children}
                <Tooltip
                    title={finishedAt.toString()}
                    sx={{ alignSelf: "flex-end" }}
                >
                    <Typography variant="caption">
                        {`Last Updated: ${fromNow(finishedAt)}`}
                    </Typography>
                </Tooltip>
            </Stack>
        </>
    );
}
export class Header extends Component<{
    children?: ReactNode;
    file: string;
}> {
    render(): ReactNode {
        return (
            <AppBar position="sticky" sx={{ px: "12px", py: "6px" }}>
                <Stack
                    justifyContent={"space-between"}
                    flexDirection="row"
                    display="flex"
                    alignItems="center"
                >
                    <HeaderWithAppConfig file={this.props.file}>
                        {this.props.children ?? <></>}
                    </HeaderWithAppConfig>
                </Stack>
            </AppBar>
        );
    }
}
