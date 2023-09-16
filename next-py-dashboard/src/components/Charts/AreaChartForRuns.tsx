import type DetailsOfRun from "@/types/testRun";
import React, { Component, type ReactNode } from "react";
import Highcharts from "highcharts";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import dayjs from "dayjs";
import { statusColors } from "@/components/parseUtils";
import darkUnica from "highcharts/themes/dark-unica";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(timezone);

if (typeof Highcharts === "object") {
    HighchartsExporting(Highcharts);
    darkUnica(Highcharts);
}

export default function AreaChartsForRuns(props: {
    runs: DetailsOfRun[];
    showTest: boolean;
}): ReactNode {
    const text = props.showTest ? "Tests" : "Suites";
    const options: Highcharts.Options = {
        chart: {
            type: "area",
        },
        colors: statusColors,
        title: {
            useHTML: true,
            text: `Cumulative ${text} Results Over Time`,
            align: "left",
        },
        subtitle: {
            text:
                '<a href="https://energiogklima.no/klimavakten/land-med-hoyest-utslipp/"' +
                'target="_blank">Reference</a>',
            align: "left",
        },
        xAxis: {
            type: "datetime",
            dateTimeLabelFormats: {
                second: "%H:%M:%S",
                minute: "%H:%M",
                hour: "%H:%M",
                day: "%e %b",
                week: "%e %b",
                month: "%b %Y",
                year: "%Y",
            },
            title: {
                text: "Date",
            },
            tickInterval: 1000 * 60 * 60,
        },
        yAxis: {
            title: {
                text: undefined,
            },
        },
        tooltip: {
            enabled: true,
            shadow: true,
            animation: true,
        },
        plotOptions: {
            area: {
                stacking: "normal",
                shadow: true,
                lineColor: "#666666",
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: "#666666",
                },
            },
        },
        series: [
            {
                type: "area",
                name: "Passed",
                data: props.runs.map((run) => [
                    dayjs(run.started).valueOf(),
                    props.showTest
                        ? run.passed
                        : JSON.parse(run.suiteSummary).passed,
                ]),
            },
            {
                type: "area",
                name: "Failed",
                data: props.runs.map((run) => [
                    dayjs(run.started).valueOf(),
                    -(props.showTest
                        ? run.failed
                        : JSON.parse(run.suiteSummary).failed),
                ]),
            },
            {
                type: "area",
                name: "Skipped",
                data: props.runs.map((run) => [
                    dayjs(run.started).valueOf(),
                    props.showTest
                        ? run.skipped
                        : JSON.parse(run.suiteSummary).skippeds,
                ]),
            },
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
