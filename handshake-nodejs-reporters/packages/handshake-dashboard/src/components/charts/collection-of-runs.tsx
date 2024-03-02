import type TestRunRecord from 'src/types/test-run-records';
import React, { type ReactNode } from 'react';
import dayjs from 'dayjs';
import DayJSUtc from 'dayjs/plugin/utc';
import DayJSTimezone from 'dayjs/plugin/timezone';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    DatasetComponent,
    LegendComponent,
} from 'echarts/components';

import type {
    TitleComponentOption,
    TooltipComponentOption,
    ToolboxComponentOption,
    LegendComponentOption,
    AxisPointerComponentOption,
} from 'echarts/components';
import { LineChart } from 'echarts/charts';

import type { LineSeriesOption } from 'echarts/charts';
import type { ComposeOption } from 'echarts/core';

dayjs.extend(DayJSUtc);
dayjs.extend(DayJSTimezone);

type composed = ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | ToolboxComponentOption
    | AxisPointerComponentOption
    | LegendComponentOption
>;

// Features like Universal Transition and Label Layout

// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { SVGRenderer } from 'echarts/renderers';
import {
    radiantBlue,
    radiantGreen,
    radiantRed,
    radiantYellow,
    serif,
    toolTipFormats,
} from './constants';
import { dateTimeFormatUsed } from '../utils/Datetime/format';
import type { DetailedTestRecord } from '@/types/parsed-records';

// Register the required components
echarts.use([
    TitleComponent,
    SVGRenderer,
    LegendComponent,
    LineChart,
    TooltipComponent,
    DatasetComponent,
]);

export default function AreaChartsForRuns(properties: {
    runs: TestRunRecord[];
    showTest: boolean;
}): ReactNode {
    const text = properties.showTest ? 'Tests' : 'Suites';

    const passed = properties.runs.map((run) =>
        properties.showTest ? run.passed : JSON.parse(run.suiteSummary).passed,
    );
    const failed = properties.runs.map((run) =>
        properties.showTest ? run.failed : JSON.parse(run.suiteSummary).failed,
    );
    const skipped = properties.runs.map((run) =>
        properties.showTest
            ? run.skipped
            : JSON.parse(run.suiteSummary).skipped,
    );

    const options: composed = {
        color: ['yellow', 'red', 'green'], // opposite of legend's data
        title: {
            text: `Cumulative ${text} Results Over Time`,
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
            },
            ...toolTipFormats,
        },
        textStyle: {
            // fontFamily: serif.style.fontFamily
        },
        legend: {
            data: ['Passed', 'Failed', 'Skipped'],
            align: 'right',
            right: 40,
            textStyle: { color: 'white' },
            top: 3,
        },
        toolbox: {
            feature: {
                saveAsImage: {},
            },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: properties.runs.map((run) =>
                dayjs(run.started).format(dateTimeFormatUsed),
            ),
            splitLine: {
                show: false,
            },
        },
        yAxis: [
            {
                type: 'value',
                splitLine: {
                    show: false,
                },
            },
        ],
        series: [
            {
                name: 'Skipped',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: {
                    width: 0,
                },
                showSymbol: false,
                areaStyle: {
                    opacity: 0.8,
                    color: radiantYellow,
                },
                emphasis: {
                    focus: 'series',
                },
                data: skipped,
            },

            {
                name: 'Failed',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: {
                    width: 0,
                },
                showSymbol: false,
                areaStyle: {
                    opacity: 0.8,
                    color: radiantRed,
                },
                emphasis: {
                    focus: 'series',
                },
                data: failed,
            },
            {
                name: 'Passed',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: {
                    width: 0,
                },
                showSymbol: false,
                areaStyle: {
                    opacity: 0.8,
                    color: radiantGreen,
                },
                emphasis: {
                    focus: 'series',
                },
                data: passed,
            },
        ],
    };
    return <ReactECharts option={options} />;
}

export function TestEntitiesOverTime(properties: {
    relatedRuns: DetailedTestRecord[];
    showSuites?: boolean;
}) {
    const option: composed = {
        tooltip: {
            trigger: 'item',
            axisPointer: {
                type: 'cross',
            },
        },
        textStyle: {
            fontFamily: serif.style.fontFamily,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: properties.relatedRuns.map((run) =>
                run.Started[0].format(dateTimeFormatUsed),
            ),
            show: false,
        },
        label: {
            show: false,
        },
        yAxis: {
            type: 'value',
            show: false,
        },
        grid: { top: '10%', width: '100%', left: '1%', height: '100%' },

        series: [
            {
                data: properties.relatedRuns.map((run) => ({
                    value: properties.showSuites ? run.Suites : run.Tests,
                })),
                type: 'line',
                smooth: true,
                showSymbol: false,
                tooltip: {
                    show: false,
                },
                areaStyle: {
                    opacity: 0.8,
                    color: radiantBlue,
                },
                lineStyle: {
                    width: 0,
                },
            },
        ],
    };
    return (
        <ReactECharts
            option={option}
            style={{
                width: '100%',
                marginBottom: '0px',
                height: '100px',
            }}
        />
    );
}
