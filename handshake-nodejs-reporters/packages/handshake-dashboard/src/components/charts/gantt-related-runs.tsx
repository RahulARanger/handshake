import React, { type ReactNode } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    DatasetComponent,
} from 'echarts/components';

import type {
    TitleComponentOption,
    TooltipComponentOption,
    ToolboxComponentOption,
} from 'echarts/components';
import { BarChart } from 'echarts/charts';

import type { BarSeriesOption } from 'echarts/charts';
import type { ComposeOption } from 'echarts/core';

type composed = ComposeOption<
    | BarSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | ToolboxComponentOption
>;

// Features like Universal Transition and Label Layout
import { LabelLayout, UniversalTransition } from 'echarts/features';

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
import type TestRunRecord from 'src/types/test-run-records';
import dayjs from 'dayjs';

// Register the required components
echarts.use([
    TitleComponent,
    SVGRenderer,
    LabelLayout,
    UniversalTransition,
    BarChart,
    TooltipComponent,
    DatasetComponent,
]);

export default function GanttChartForRelatedRuns(properties: {
    runs: TestRunRecord[];
}): ReactNode {
    const passes = [];
    const fails = [];
    const skips = [];
    const runs = [];

    for (const run of properties.runs) {
        passes.push((run.passed / run.tests) * 1e2);
        fails.push((run.failed / run.tests) * 1e2);
        skips.push((run.skipped / run.tests) * 1e2);
        runs.push(dayjs(run.ended).fromNow());
    }

    const options: composed = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
            ...toolTipFormats,
            appendToBody: true,
        },
        textStyle: {
            fontFamily: serif.style.fontFamily,
        },
        grid: { left: 0, right: 1, top: 0 },
        legend: { show: false },
        xAxis: {
            show: false,
            type: 'category',
            data: runs,
        },
        yAxis: {
            show: false,
            type: 'value',
        },

        series: [
            {
                name: 'Passed',
                type: 'bar',
                color: radiantGreen,
                stack: 'total',
                label: {
                    show: false,
                },
                data: passes,
            },
            {
                name: 'Failed',
                type: 'bar',
                stack: 'total',
                color: radiantRed,
                label: {
                    show: false,
                },
                data: fails,
            },
            {
                name: 'Skipped',
                type: 'bar',
                color: radiantYellow,
                stack: 'total',
                label: {
                    show: false,
                },
                data: skips,
            },
        ],
    };
    return (
        <ReactECharts
            option={options}
            style={{ alignSelf: 'center', height: 150 }}
        />
    );
}
