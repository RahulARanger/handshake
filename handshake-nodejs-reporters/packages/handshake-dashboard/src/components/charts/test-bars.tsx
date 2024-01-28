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
import { standingToColors, toolTipFormats } from './constants';
import type {
    ParsedSuiteRecord,
    ParsedTestRecord,
} from 'src/types/parsed-records';
import type {
    CallbackDataParams,
    TopLevelFormatterParams,
} from 'echarts/types/dist/shared';

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

export default function TestEntitiesBars(properties: {
    entities: Array<ParsedTestRecord | ParsedSuiteRecord>;
    onClick: (_: string) => void;
}): ReactNode {
    const options: composed = {
        tooltip: {
            ...toolTipFormats,
            position: 'bottom',
            formatter: (parameters: TopLevelFormatterParams) => {
                const arguments_ = parameters as CallbackDataParams;
                return `${arguments_.marker} ${arguments_.name} - <b>${
                    properties.entities[arguments_.dataIndex ?? 0].type
                }</b>`;
            },
        },
        legend: { show: false },

        grid: { left: 0, right: 1, top: 0, bottom: 0 },
        xAxis: [
            {
                type: 'category',
                data: properties.entities.map((entity) => entity.Title),
                show: false,
            },
        ],
        yAxis: [
            {
                type: 'value',
                show: false,
            },
        ],
        series: [
            {
                name: 'Test Entities',
                type: 'bar',
                data: properties.entities.map((entity) => ({
                    value: 1,
                    itemStyle: { color: standingToColors[entity.Status] },
                    id: entity.Id,
                })),
                itemStyle: {
                    borderRadius: 150,
                    borderColor: 'black',
                    borderType: 'solid',
                    borderWidth: 0.69,
                },
            },
        ],
    };
    return (
        <ReactECharts
            option={options}
            style={{
                height: '40px',
                flexGrow: 1,
                width:
                    properties.entities.length < 15
                        ? `${100 + (50 * properties.entities.length) / 3}px`
                        : '100%',
            }}
            opts={{ renderer: 'svg' }}
            onEvents={{
                click: (_: { data: { id: string } }) =>
                    properties.onClick(_.data.id),
            }}
        />
    );
}
