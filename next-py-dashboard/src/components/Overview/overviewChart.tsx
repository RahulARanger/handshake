import RelativeTime from "../Datetime/relativeTime";
import { type TestRunSummary } from "@/types/testRun";
import Skeleton from "@mui/material/Skeleton";
import Counter from "./counter";
import useSWR from "swr";
import GraphCard from "../graphCard";
import type dayjs from "dayjs";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Android12Switch from "../switch";
import React, { useState, type ReactNode } from "react";
import Grid from "@mui/material/Grid";
import { getTestRunSummary } from "@/Generators/helper";
import Highcharts from "highcharts";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import Highcharts3d from "highcharts/highcharts-3d";

if (typeof Highcharts === "object") {
    Highcharts3d(Highcharts);
    HighchartsExporting(Highcharts);
}

export default function ProgressPieChart(props: {
    test_id: string;
    startDate: dayjs.Dayjs;
    port: string;
}): ReactNode {
    const [isTestCases, showTestCases] = useState<boolean>(true);
    const { data: runSummary } = useSWR<TestRunSummary>(
        getTestRunSummary(props.port, props.test_id)
    );
    if (runSummary === undefined) return <Skeleton width={150} height={150} />;

    const total = isTestCases
        ? runSummary.TESTS.tests
        : runSummary.SUITES.count;

    const _overallPassed =
        (isTestCases ? runSummary.TESTS.passed : runSummary.SUITES.passed) /
        total;
    const passPercent = Number.isNaN(_overallPassed) ? 0 : _overallPassed;

    const options = {
        credits: { enabled: false, text: "link-to-docs-in-future" },
        chart: {
            type: "pie",
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0,
                fitToPlot: true,
            },
            backgroundColor: "transparent",
            height: 155,
        },

        title: {
            text: `${(passPercent * 100).toFixed(2)}%`,
            verticalAlign: "middle",
            style: {
                fontSize: 12,
                color: "white",
            },
        },
        subtitle: {
            text: undefined,
        },
        plotOptions: {
            pie: {
                innerSize: 69,
                depth: 15,
                colors: ["green", "#FC4349", "#2C3E50"],
            },
        },
        series: [
            {
                type: "pie",
                name: !isTestCases ? "Suite Entities" : "Test Entities",
                data: [
                    [
                        "Passed",
                        isTestCases
                            ? runSummary.TESTS.passed
                            : runSummary.SUITES.passed,
                    ],
                    [
                        "Failed",
                        isTestCases
                            ? runSummary.TESTS.failed
                            : runSummary.SUITES.failed,
                    ],
                    [
                        "Skipped",
                        isTestCases
                            ? runSummary.TESTS.skipped
                            : runSummary.SUITES.skipped,
                    ],
                ],
                dataLabels: {
                    style: {
                        textOutline: "0px",
                        color: "white",
                    },
                    alignTo: "center",
                    distance: 10,
                },
            },
        ],
    };

    return (
        <GraphCard
            sx={{
                flexShrink: 1,
                p: "6px",
                gap: "10px",
            }}
        >
            <Grid container columns={4} gap={1} sx={{ flexWrap: "nowrap" }}>
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
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                    />
                </Grid>
            </Grid>
        </GraphCard>
    );
}
