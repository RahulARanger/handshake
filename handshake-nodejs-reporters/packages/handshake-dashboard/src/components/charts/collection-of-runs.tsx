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
    GridComponent,
    MarkLineComponent,
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

// Features like Universal Transition and Label Layout

// Import the Canvas renderer
// Note that including the CanvasRenderer or SVGRenderer is a required step
import { SVGRenderer } from 'echarts/renderers';
import {
    radiantBlue,
    radiantGreen,
    radiantOrange,
    radiantRed,
    radiantYellow,
    serif,
    toolTipFormats,
} from './constants';
import { dateTimeFormatUsed } from '../utils/Datetime/format';
import type { DetailedTestRecord } from '@/types/parsed-records';
import type {
    GridComponentOption,
    MarkLineComponentOption,
} from 'echarts/lib/echarts';
import type { MarkLineOption } from 'echarts/types/dist/shared';

type composed = ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | GridComponentOption
    | TooltipComponentOption
    | ToolboxComponentOption
    | AxisPointerComponentOption
    | LegendComponentOption
    | MarkLineComponentOption
>;

// Register the required components
echarts.use([
    TitleComponent,
    SVGRenderer,
    LegendComponent,
    LineChart,
    GridComponent,
    TooltipComponent,
    DatasetComponent,
    MarkLineComponent,
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
    currentRun: string;
}) {
    const index = properties.relatedRuns.findIndex(
        (run) => run.Id === properties.currentRun,
    );
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
        grid: {
            width: '95%',
            left: '2%',
            right: '5%',
            top: '0.5px',
            height: '95%',
        },
        series: [
            {
                name: 'Related Test Runs',
                id: 'related-test-runs',
                data: properties.relatedRuns.map((run) =>
                    properties.showSuites ? run.Suites : run.Tests,
                ),
                markLine: {
                    symbol: 'pin',
                    symbolSize: 30,
                    label: {
                        show: true,
                        position: 'middle',
                        offset: [0, index > 0 ? 0 : 2],
                        formatter: 'Current Run',
                        textBorderWidth: 2,
                        color: 'whitesmoke',
                        textBorderColor: 'black',
                    },
                    data: [
                        {
                            xAxis: index,
                            name: 'Current Test Run',
                            itemStyle: {
                                color: radiantOrange,
                            },
                        },
                    ],
                    tooltip: {
                        trigger: 'item',
                        ...(toolTipFormats as MarkLineOption['tooltip']),
                        formatter: `Current Test Run`,
                    },
                },
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
                marginBottom: '10px',
                height: '100px',
            }}
        />
    );
}
