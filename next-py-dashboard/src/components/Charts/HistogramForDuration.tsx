import type DetailsOfRun from "@/types/testRun";
import React, { type ReactNode } from "react";
import HighchartsMore from "highcharts/highcharts-more";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import { statusColors } from "@/components/parseUtils";
import darkUnica from "highcharts/themes/dark-unica";
import Highcharts from "highcharts";

if (typeof Highcharts === "object") {
    HighchartsExporting(Highcharts);
    darkUnica(Highcharts);
    HighchartsMore(Highcharts);
}

export default function HistogramForDuration(props: {
    runs: DetailsOfRun[];
}): ReactNode {
    const options: Highcharts.Options = {
        chart: {
            type: "boxplot",
        },
        // colors: statusColors,
        title: {
            useHTML: true,
            text: `Distribution of Duration of Test Run`,
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
                type: "boxplot",
                name: "Observations",
                data: [
                    [760, 801, 848, 895, 965],
                    [733, 853, 939, 980, 1080],
                    [714, 762, 817, 870, 918],
                    [724, 802, 806, 871, 950],
                    [834, 836, 864, 882, 910],
                ],
                tooltip: {
                    headerFormat: "<em>Experiment No {point.key}</em><br/>",
                },
            },
            {
                name: "Outliers",
                // color: Highcharts.getOptions().colors[0],
                type: "scatter",
                data: [
                    // x, y positions where 0 is the first category
                    [0, 644],
                    [4, 718],
                    [4, 951],
                    [4, 969],
                ],
                marker: {
                    fillColor: "white",
                    lineWidth: 1,
                    // lineColor: Highcharts.getOptions().colors[0]
                },
                tooltip: {
                    pointFormat: "Observation: {point.y}",
                },
            },
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
