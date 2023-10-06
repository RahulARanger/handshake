import Highcharts from "highcharts";
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import React, { type ReactNode } from "react";
import { statusColors } from "../parseUtils";
import brandDark from "highcharts/themes/brand-dark";

if (typeof Highcharts === "object") {
    HighchartsExporting(Highcharts);
    brandDark(Highcharts);
}

export default function RenderPassedRate(props: {
    value: [number, number, number];
    width?: number;
}): ReactNode {
    const options: Highcharts.Options = {
        chart: {
            type: "bar",
            height: 30,
            borderWidth: 0,
            width: props.width ?? 220,
            margin: 0,
            backgroundColor: "transparent",
            style: {
                padding: "1px",
            },
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
                dataLabels: {
                    enabled: true,
                    color: "white",
                },
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
