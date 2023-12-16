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
    | LegendComponentOption
>;

// Features like Universal Transition and Label Layout

// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { SVGRenderer } from 'echarts/renderers';
import {
    radiantGreen,
    radiantRed,
    radiantYellow,
    serif,
    toolTipFormats,
} from './constants';
import { dateTimeFormatUsed } from '../utils/Datetime/format';

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
        textStyle: { fontFamily: serif.style.fontFamily },
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
        },
        yAxis: [
            {
                type: 'value',
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
