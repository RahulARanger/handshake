import Highcharts from "highcharts";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import Highcharts3d from "highcharts/highcharts-3d";
import React, { type ReactNode } from "react";
import { Skeleton } from "@mui/material";
import { statusColors } from "../parseUtils";

if (typeof Highcharts === "object") {
    HighchartsExporting(Highcharts);
}

export function RenderPassedRate(props: {
    value?: [number, number, number];
    "hot-renderer": true;
}): ReactNode {
    if (props.value == null) return <Skeleton width={50} height={30} />;
    const options: Highcharts.Options = {
        chart: {
            type: "bar",
            height: 40,
            margin: 2,
        },

        credits: { enabled: false },
        title: {
            text: undefined,
        },
        colors: statusColors,
        xAxis: {
            categories: ["Status"],
            visible: false,
        },
        tooltip: {
            shared: true,
            outside: true,
            pointFormat:
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        },
        yAxis: {
            min: 0,
            visible: false,
        },
        legend: {
            reversed: true,
            enabled: false,
        },
        plotOptions: {
            series: {
                stacking: "percent",
                crisp: true,
                shadow: true,
            },
        },
        exporting: { enabled: false },
        series: [
            {
                type: "bar",
                name: "Passed",
                data: [props.value[0]],
            },
            {
                type: "bar",
                name: "Failed",
                data: [props.value[1]],
            },
            {
                type: "bar",
                name: "Skipped",
                data: [props.value[2]],
            },
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
