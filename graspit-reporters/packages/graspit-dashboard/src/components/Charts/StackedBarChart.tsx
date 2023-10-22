import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import React, { type ReactNode } from 'react';
import { statusColors } from '../parseUtils';
import highContrastDark from 'highcharts/themes/high-contrast-dark';
import { toolTipFormats } from '../utils/counter';

if (typeof Highcharts === 'object') {
    HighchartsExporting(Highcharts);
    highContrastDark(Highcharts);
}

export default function RenderPassedRate(props: {
    value: [number, number, number];
    width?: number;
    immutable?: boolean;
}): ReactNode {
    const options: Highcharts.Options = {
        chart: {
            type: 'bar',
            height: 30,
            width: props.width ?? 200,
            borderWidth: 0,
            margin: 0,
            backgroundColor: 'transparent',
            reflow: true,
        },
        credits: { enabled: false },
        title: {
            text: undefined,
        },
        colors: statusColors,
        xAxis: {
            categories: ['Status'],
            visible: false,
        },
        tooltip: {
            shared: true,
            outside: true,
            pointFormat:
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
            ...toolTipFormats,
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
                shadow: {
                    offsetX: 0,
                    offsetY: 5,
                    opacity: 0.2,
                    width: 5,
                },
                crisp: true,
                opacity: 0.96,
                borderWidth: 0,
                stacking: 'percent',
                dataLabels: {
                    enabled: true,
                    color: 'white',
                    shadow: false,
                    filter: {
                        property: 'percentage',
                        operator: '>',
                        value: 0,
                    },
                    style: {
                        textOutline: 'none',
                    },
                },
            },
        },
        exporting: { enabled: false },
        series: [
            {
                type: 'bar',
                name: 'Passed',
                data: [props.value[0]],
            },
            {
                type: 'bar',
                name: 'Failed',
                data: [props.value[1]],
            },
            {
                type: 'bar',
                name: 'Skipped',
                data: [props.value[2]],
            },
        ],
    };
    return (
        <HighchartsReact
            highcharts={Highcharts}
            options={options}
            immutable={props.immutable}
            allowChartUpdate={!props.immutable}
            containerProps={{
                style: { width: '100%', height: '25px' },
            }}
        />
    );
}
