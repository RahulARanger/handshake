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
    toolTipFormats,
} from './constants';
import { LOCATORS } from 'handshake-utils';

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

export default function RenderPassedRate(properties: {
    value: [number, number, number];
    width?: number;
    immutable?: boolean;
    title?: string;
}): ReactNode {
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
            // fontFamily: serif.style.fontFamily,
        },
        grid: { left: 0, right: 1 },
        legend: { show: false },
        xAxis: {
            show: false,
            type: 'value',
        },
        yAxis: {
            show: false,
            type: 'category',
            data: [properties.title ?? 'Tests'],
        },

        series: [
            {
                name: 'Passed',
                type: 'bar',
                color: radiantGreen,
                stack: 'total',
                label: {
                    show: true,
                    verticalAlign: 'top',
                },
                data: [properties.value[0]],
            },
            {
                name: 'Failed',
                type: 'bar',
                stack: 'total',
                color: radiantRed,
                label: { show: true, verticalAlign: 'top' },
                data: [properties.value[1]],
            },
            {
                name: 'Skipped',
                type: 'bar',
                color: radiantYellow,
                stack: 'total',
                label: { show: true, verticalAlign: 'top' },
                data: [properties.value[2]],
            },
        ],
    };
    return (
        <ReactECharts
            option={options}
            style={{
                height: '15px',
                width: properties.width ?? 180,
                marginTop: '3px',
                padding: '0px',
            }}
            className={`${properties.value[0]}-${properties.value[1]}-${properties.value[2]} ${LOCATORS.CHARTS.rate}`}
            opts={{ renderer: 'svg' }}
            notMerge={true}
            lazyUpdate={true}
        />
    );
}
