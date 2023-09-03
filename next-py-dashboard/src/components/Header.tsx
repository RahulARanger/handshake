import { AppBar, Stack, Typography, Tooltip, Skeleton } from "@mui/material";
import React, { type ReactNode } from "react";
import { fetcher } from "./helper";
import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import useSWRImmutable from "swr/immutable";
import type DetailsOfRun from "@/types/testRun";
import Chip from "@mui/material/Chip";
import dayjs from "dayjs";
import RelativeTime from "./Datetime/relativeTime";
import HeaderBarStyles from "@/styles/header.module.css";

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
        <AppBar
            position="relative"
            sx={{ px: "12px", py: "6px", top: "0px" }}
            className={HeaderBarStyles.header}
        >
            <Stack
                justifyContent={"space-between"}
                flexDirection="row"
                display="flex"
                sx={{ backgroundColor: "transparent" }}
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
