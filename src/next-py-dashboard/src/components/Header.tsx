import { AppBar, Stack, Typography, Tooltip, Skeleton } from "@mui/material";
import React, { type ReactNode } from "react";
import { fetcher, fromNow } from "./helper";
import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import useSWRImmutable from "swr/immutable";
import type DetailsOfRun from "@/types/testRun";
import Chip from "@mui/material/Chip";
import { formatDateTime } from "./parseUtils";
import dayjs from "dayjs";
import RelativeTime from "./Datetime/relativeTime";

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
    const finishedAt = dayjs(data.ended);

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
                            <Tooltip title="Label">
                                <Chip
                                    label={data.label}
                                    size={"small"}
                                    color="warning"
                                />
                            </Tooltip>
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
                    <RelativeTime dateTime={finishedAt} />
                </Stack>
            </Stack>
        </AppBar>
    );
}
