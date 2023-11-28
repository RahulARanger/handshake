import type TestRunRecord from 'src/types/testRunRecords';
import type { SuiteSummary } from 'src/types/testRunRecords';
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

export default function ProgressPieChart(props: {
    run: TestRunRecord;
    isTestCases: boolean;
}): ReactNode {
    const suite: SuiteSummary = JSON.parse(props.run.suiteSummary);
    const failed = props.isTestCases ? props.run.failed : suite.failed;
    const passed = props.isTestCases ? props.run.passed : suite.passed;
    const skipped = props.isTestCases ? props.run.skipped : suite.skipped;

    const options: composed = {
        tooltip: {
            trigger: 'item',
            formatter: (param: TopLevelFormatterParams) => {
                const args = param as CallbackDataParams;
                // correct the percentage
                return `${args.seriesName}<br/>${args.marker}  ${args.name}: ${
                    args.value
                } (${(args.percent ?? 0) * 2}%)`;
            },
            ...toolTipFormats,
        },
        textStyle: {
            fontFamily: serif.style.fontFamily,
        },
        series: [
            {
                name: props.isTestCases ? 'Tests' : 'Suites',
                type: 'pie',
                top: 80,
                left: -35,
                radius: ['200%', '400%'],
                startAngle: 180,
                itemStyle: {
                    borderRadius: 5,
                },
                label: {
                    show: true,
                    color: 'white',
                    verticalAlign: 'bottom',
                    formatter: '{b}:{c}',
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
                    {
                        name: 'Buffer',
                        itemStyle: {
                            // stop the chart from rendering this piece
                            color: 'none',
                            decal: {
                                symbol: 'none',
                            },
                        },
                        label: {
                            show: false,
                        },
                        value: passed + skipped + failed,
                    },
                ],
            },
        ],
    };

    return (
        <ReactECharts
            option={options}
            style={{ height: '120px' }}
            opts={{ renderer: 'svg' }}
        />
    );
}
