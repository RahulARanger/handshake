import type DetailsOfRun from "@/types/testRun";
import React, { type ReactNode } from "react";
import Highcharts from "highcharts/highcharts-more";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import { statusColors } from "@/components/parseUtils";
import darkUnica from "highcharts/themes/dark-unica";

if (typeof Highcharts === "object") {
    HighchartsExporting(Highcharts);
    darkUnica(Highcharts);
}

export default function HistogramForDuration(props: {
    runs: DetailsOfRun[];
}): ReactNode {
    const options: Highcharts.Options = {
        chart: {
            type: "histogram",
        },
        colors: statusColors,
        title: {
            useHTML: true,
            text: `Cumulative Results Over Time`,
            align: "left",
        },
        subtitle: {
            text:
                '<a href="https://energiogklima.no/klimavakten/land-med-hoyest-utslipp/"' +
                'target="_blank">Reference</a>',
            align: "left",
        },
        xAxis: {
            title: {
                text: "Value",
            },
        },
        yAxis: {
            title: {
                text: "Frequency",
            },
        },
        series: [
            {
                name: "Histogram",
                type: "histogram",
                xAxis: 1,
                yAxis: 1,
                baseSeries: "s1",
                zIndex: -1,
            },
            {
                name: "Data",
                type: "scatter",
                data: props.runs.map((run) => run.duration),
                id: "s1",
                marker: {
                    radius: 1.5,
                },
            },
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
