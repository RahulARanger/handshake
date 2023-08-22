import React, { useState, type ReactNode, useCallback, useMemo } from "react";
import CountUp from "react-countup";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import readDateForKey, { fromNow } from "../helper";
import GraphCard from "../graphCard";
import type dayjs from "dayjs";
import Grid from "@mui/material/Grid";
import CarouselComponent from "../carousel";
import type DetailsOfRun from "@/types/testRun";
import { type OverviewPageProps } from "@/types/detailedTestRunPage";
import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip as ChartTip,
    Legend,
    type ChartOptions,
    type ChartData,
} from "chart.js";
import useSWR from "swr";
import Android12Switch from "../switch";
import TestEntities from "./TableEntities";
import { formatDateTime } from "../parseUtils";
import RelativeTime from "../Datetime/relativeTime";
ChartJS.register(ArcElement, ChartTip, Legend);

function ProgressPieChart(props: {
    passed: number;
    failed: number;
    skipped: number;
    startDate: dayjs.Dayjs;
    tests: number;
}): ReactNode {
    const [isTestCases, showTestCases] = useState(false);

    const data: ChartData<"doughnut"> = {
        labels: ["Passed", "Failed", "Skipped"],
        datasets: [
            {
                data: [props.passed, props.failed, props.skipped],
                backgroundColor: ["green", "#FC4349", "#2C3E50"],
                borderWidth: 0.2,
            },
        ],
    };
    const options: ChartOptions<"doughnut"> = {
        plugins: {
            legend: {
                align: "center",
                display: true,
                position: "right",
            },
            title: {
                display: false,
            },
        },
        borderColor: "#D7DADB",
        layout: {
            padding: 6,
        },
        responsive: true,
        maintainAspectRatio: false,
        cutout: 45,
    };
    return (
        <GraphCard
            sx={{
                flexShrink: 1,
                p: "6px",
                gap: "10px",
                flexWrap: "wrap",
            }}
        >
            <Grid container columns={4} gap={3}>
                <Grid item md={1}>
                    &nbsp;
                    <Typography variant="caption">Executed,</Typography>
                    <br />
                    <Stack
                        flexDirection="row"
                        flexWrap={"nowrap"}
                        alignItems={"center"}
                        columnGap={"5px"}
                        ml="10px"
                    >
                        <b>
                            <CountUp
                                end={props.tests}
                                useIndianSeparators={true}
                                formattingFn={(n: number) =>
                                    n
                                        .toString()
                                        .padStart(
                                            Math.floor(
                                                Math.log10(props.tests) + 1
                                            ),
                                            "0"
                                        )
                                }
                            />
                        </b>
                        <Typography variant="subtitle1">
                            {!isTestCases ? "Test Suites" : "Test Cases"}
                        </Typography>
                    </Stack>
                    <RelativeTime dateTime={props.startDate} />
                    <br />
                    <Divider />
                    <Stack
                        flexDirection="row"
                        alignItems={"center"}
                        justifyContent={"flex-start"}
                        columnGap={"5px"}
                        sx={{ m: "3px", mt: "10px" }}
                    >
                        <Typography>Suites</Typography>
                        <Android12Switch
                            onChange={(_, isChecked: boolean) => {
                                showTestCases(isChecked);
                            }}
                        />
                        <Typography>Tests</Typography>
                    </Stack>
                </Grid>
                <Grid item md={1} mr={2} sx={{ minWidth: "300px" }}>
                    <Doughnut data={data} options={options}></Doughnut>
                </Grid>
                {/* <Grid md={1.2}>
                    <OverviewOfFeatures features={props.features} />
                </Grid> */}
            </Grid>
        </GraphCard>
    );
}

export default function Overview(props: OverviewPageProps): ReactNode {
    const { data } = useSWR<DetailsOfRun>(props.getTestRun);
    if (data == null) return <>Report not found</>;
    return (
        <Grid
            container
            gap={6}
            columns={4.5}
            spacing={2}
            sx={{ bgColor: "background.default", flexGrow: 1 }}
        >
            <Grid item md={2} sm={3} minWidth={"250px"}>
                <ProgressPieChart
                    passed={data.passed}
                    failed={data.failed}
                    skipped={data.skipped}
                    startDate={readDateForKey(data.started)}
                    tests={data.tests}
                />
            </Grid>
            <Grid item md={2} sm={2} minWidth={"250px"}>
                <CarouselComponent />
            </Grid>
            <Grid item md={2.5} sm={3} minWidth={"250px"}>
                <TestEntities
                    getSuites={props.getSuites}
                    getTestRun={props.getTestRun}
                />
            </Grid>
            {/* <Grid md={1.5} sm={2} minWidth={"250px"}>
                <KeyValuePairs vars={data.vars} />
            </Grid> */}
        </Grid>
    );
}
