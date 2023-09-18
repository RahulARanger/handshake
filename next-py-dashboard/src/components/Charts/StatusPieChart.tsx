import { type SuiteSummary } from "@/types/testRun";
import type DetailsOfRun from "@/types/testRun";
import React, { type ReactNode } from "react";
import Highcharts from "highcharts";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import Highcharts3d from "highcharts/highcharts-3d";
import brandDark from "highcharts/themes/brand-dark";

if (typeof Highcharts === "object") {
    Highcharts3d(Highcharts);
    HighchartsExporting(Highcharts);
    brandDark(Highcharts);
}

export default function ProgressPieChart(props: {
    run: DetailsOfRun;
    isTestCases: boolean;
}): ReactNode {
    const suite: SuiteSummary = JSON.parse(props.run.suiteSummary);
    const total = props.isTestCases ? props.run.tests : suite.count;

    const _overallPassed =
        (props.isTestCases ? props.run.passed : suite.passed) / total;
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
            backgroundColor: "#141414",
            height: 205,
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
                innerSize: 90,
                depth: 15,
                colors: ["green", "#FC4349", "#2C3E50"],
            },
        },
        series: [
            {
                type: "pie",
                name: !props.isTestCases ? "Suite Entities" : "Test Entities",
                data: [
                    [
                        "Passed",
                        props.isTestCases ? props.run.passed : suite.passed,
                    ],
                    [
                        "Failed",
                        props.isTestCases ? props.run.failed : suite.failed,
                    ],
                    [
                        "Skipped",
                        props.isTestCases ? props.run.skipped : suite.skipped,
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

    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
