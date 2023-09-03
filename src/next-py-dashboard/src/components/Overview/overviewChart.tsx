import RelativeTime from "../Datetime/relativeTime";
import { type TestRunSummary } from "@/types/testRun";
import { Skeleton } from "@mui/material";
import Counter from "./counter";
import { Doughnut } from "react-chartjs-2";
import { type ChartOptions, type ChartData } from "chart.js";
import useSWR from "swr";
import GraphCard from "../graphCard";
import type dayjs from "dayjs";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Android12Switch from "../switch";
import React, { useState, type ReactNode } from "react";
import Grid from "@mui/material/Grid";
import Badge from "@mui/material/Badge";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip as ChartTip,
    Legend,
} from "chart.js";

ChartJS.register(ArcElement, ChartTip, Legend);

export default function ProgressPieChart(props: {
    runSummary: string;
    startDate: dayjs.Dayjs;
}): ReactNode {
    const [isTestCases, showTestCases] = useState(true);
    const { data: runSummary } = useSWR<TestRunSummary>(props.runSummary);
    if (runSummary === undefined) return <Skeleton width={150} height={150} />;

    const total = isTestCases
        ? runSummary.TESTS.tests
        : runSummary.SUITES.count;

    const _overallPassed =
        (isTestCases ? runSummary.TESTS.passed : runSummary.SUITES.passed) /
        total;
    const passPercent = Number.isNaN(_overallPassed) ? 0 : _overallPassed;

    const data: ChartData<"doughnut"> = {
        labels: ["Passed", "Failed", "Skipped"],
        datasets: [
            {
                data: isTestCases
                    ? [
                          runSummary.TESTS.passed,
                          runSummary.TESTS.failed,
                          runSummary.TESTS.skipped,
                      ]
                    : [
                          runSummary.SUITES.passed,
                          runSummary.SUITES.failed,
                          runSummary.SUITES.skipped,
                      ],
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
            <Grid container columns={4} gap={1}>
                <Grid item md={1.5} sm={3}>
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
                            <Counter end={total} />
                        </b>
                        <Typography variant="subtitle1">
                            {!isTestCases ? "Test Suites" : "Test Cases"}
                        </Typography>
                    </Stack>
                    <RelativeTime
                        dateTime={props.startDate}
                        style={{ marginLeft: "10px" }}
                    />
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
                            checked={isTestCases}
                        />
                        <Typography>Tests</Typography>
                    </Stack>
                </Grid>
                <Grid item md={1.5} sm={3} sx={{ minWidth: "260px" }}>
                    <Badge
                        badgeContent={
                            <Counter
                                end={passPercent * 1e2}
                                suffix="%"
                                decimalPoints={1}
                            />
                        }
                        color="primary"
                        showZero={true}
                    >
                        <Doughnut data={data} options={options} />
                    </Badge>
                </Grid>
                {/* <Grid md={1.2}>
                    <OverviewOfFeatures features={props.features} />
                </Grid> */}
            </Grid>
        </GraphCard>
    );
}
