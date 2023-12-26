import type TestRunRecord from 'src/types/test-run-records';
import type { SuiteSummary } from 'src/types/test-run-records';
import React, { type ReactNode } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import {
    TitleComponent,
    TooltipComponent,
    DatasetComponent,
    GridComponent,
} from 'echarts/components';

import type {
    TitleComponentOption,
    TooltipComponentOption,
    ToolboxComponentOption,
    GridComponentOption,
} from 'echarts/components';

import { PieChart } from 'echarts/charts';
import type { PieSeriesOption } from 'echarts/charts';
import type { ComposeOption } from 'echarts/core';

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
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';

type composed = ComposeOption<
    | PieSeriesOption
    | GridComponentOption
    | TitleComponentOption
    | TooltipComponentOption
    | ToolboxComponentOption
    | GridComponentOption
>;

// Register the required components
echarts.use([
    TitleComponent,
    SVGRenderer,
    PieChart,
    GridComponent,
    TooltipComponent,
    DatasetComponent,
]);

export default function ProgressPieChart(properties: {
    run: TestRunRecord;
    isTestCases: boolean;
}): ReactNode {
    const suite: SuiteSummary = JSON.parse(properties.run.suiteSummary);
    const failed = properties.isTestCases
        ? properties.run.failed
        : suite.failed;
    const passed = properties.isTestCases
        ? properties.run.passed
        : suite.passed;
    const skipped = properties.isTestCases
        ? properties.run.skipped
        : suite.skipped;

    const options: composed = {
        tooltip: {
            trigger: 'item',
            formatter: (parameter: TopLevelFormatterParams) => {
                const arguments_ = parameter as CallbackDataParams;
                // correct the percentage
                return `${arguments_.seriesName}<br/>${arguments_.marker}  ${
                    arguments_.name
                }: ${arguments_.value} (${(arguments_.percent ?? 0) * 2}%)`;
            },
            ...toolTipFormats,
        },
        textStyle: {
            fontFamily: serif.style.fontFamily,
        },
        series: [
            {
                name: properties.isTestCases ? 'Tests' : 'Suites',
                type: 'pie',
                top: -15,
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 5,
                },
                label: {
                    show: true,
                    color: 'white',
                    verticalAlign: 'bottom',
                    formatter: '{b}: {c}',
                },
                data: [
                    {
                        value: passed,
                        name: 'Passed',
                        itemStyle: { color: radiantGreen },
                    },
                    {
                        value: failed,
                        name: 'Failed',
                        itemStyle: { color: radiantRed },
                    },
                    {
                        value: skipped,
                        name: 'Skipped',
                        itemStyle: { color: radiantYellow },
                    },
                ],
            },
        ],
    };

    return <ReactECharts option={options} style={{ height: '220px' }} />;
}
