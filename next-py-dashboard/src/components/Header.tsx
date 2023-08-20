import { AppBar, Stack, Typography, Tooltip, Skeleton } from "@mui/material";
import React, { type ReactNode } from "react";
import readDateForKey, { fetcher, fromNow } from "./helper";
import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import useSWRImmutable from "swr/immutable";
import type DetailsOfRun from "@/types/testRun";
import Chip from "@mui/material/Chip";
import { formatDateTime } from "./parseUtils";

export default function TestRunHeader(props: OverviewPageProps): ReactNode {
    const { data, isLoading } = useSWRImmutable<DetailsOfRun>(
        props.getTestRun,
        fetcher
    );
    if (data == null || isLoading)
        return (
            <AppBar position="sticky" sx={{ px: "12px", py: "6px" }}>
                <Skeleton />
            </AppBar>
        );
    const finishedAt = readDateForKey(data.ended);
    return (
        <AppBar position="sticky" sx={{ px: "12px", py: "6px" }}>
            <Stack
                justifyContent={"space-between"}
                flexDirection="row"
                display="flex"
                alignItems="center"
            >
                <Typography variant="h6" sx={{ letterSpacing: ".2rem" }}>
                    {data.projectName}
                    <sub>
                        {data.label !== null ? (
                            <Chip
                                label={data.label}
                                size={"small"}
                                color="warning"
                            />
                        ) : (
                            <></>
                        )}
                        <Tooltip title="Framework">
                            <Chip
                                label={data.framework}
                                size="small"
                                sx={{ ml: "5px" }}
                                color="primary"
                            />
                        </Tooltip>
                    </sub>
                </Typography>
                <Stack flexDirection="row" columnGap={2} alignItems={"center"}>
                    <Tooltip
                        title={formatDateTime(finishedAt)}
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
