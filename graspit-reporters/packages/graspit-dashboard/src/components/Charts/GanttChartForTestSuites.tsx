import React, { useContext, type ReactNode, useState } from 'react';
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
import { CustomChart } from 'echarts/charts';

import type { CustomSeriesOption } from 'echarts/charts';
import type { ComposeOption } from 'echarts/core';

type composed = ComposeOption<
    | CustomSeriesOption
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
import MetaCallContext from '../core/TestRun/context';
import { getSuites, getTestRun } from '../scripts/helper';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { Affix, Switch } from 'antd/lib';
import Card from 'antd/lib/card/Card';
import TestEntityDrawer from '../core/TestEntity';
import type { SuiteDetails } from 'src/types/generatedResponse';
import type TestRunRecord from 'src/types/testRunRecords';
import type {
    CustomSeriesRenderItemAPI,
    CustomSeriesRenderItemParams,
} from 'echarts';

// Register the required components
echarts.use([
    TitleComponent,
    SVGRenderer,
    LabelLayout,
    UniversalTransition,
    CustomChart,
    TooltipComponent,
    DatasetComponent,
]);

function TimelineChart(props: {
    helper: (id: string) => void;
    projectName: string;
    y: string[];
    times: Array<[number, number]>;
    changeObserved: boolean;
}) {
    const options: composed = {
        title: {
            text: 'Bar Chart with Negative Value',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
        },
        grid: {
            top: 80,
            bottom: 30,
        },
        xAxis: {
            type: 'time',
            splitLine: {
                show: false,
            },
        },
        yAxis: {
            type: 'category',
        },
        series: [
            {
                type: 'custom',
                renderItem: function (
                    params: CustomSeriesRenderItemParams,
                    api: CustomSeriesRenderItemAPI,
                ) {
                    // This method will be called for each dataItem respectively.
                    // Notice: it does not ensure that called according to the order
                    // of `dataItem`.

                    // Some processes, such as coordinate conversion.
                    // `api.value(0)` is used to retrieve the value on the first
                    // dimension in the current `dataItem`.
                    const categoryIndex = api.value(0);
                    // `api.coord(...)` is used to convert data values to pixel values,
                    // will are necessary for graphic elements rendering.
                    const startPoint = api.coord([api.value(1), categoryIndex]);
                    const endPoint = api.coord([api.value(2), categoryIndex]);
                    // `api.size(...)` is used to calculate the pixel size corresponding to
                    // the a value range that the length is 1 on Y axis.
                    const height = api.size([0, 1])[1] * 0.6;

                    // The property `shape` incicates the location and size of this
                    // element.
                    // `echarts.graphic.clipRectByRect` is used for clipping the
                    // rectangular when it overflow the bounding box of the current
                    // coordinate system (cartesian).
                    // If the rect is totally clipped, returns undefined.
                    const rectShape = echarts.graphic.clipRectByRect(
                        {
                            // position and location of the rectangular.
                            x: startPoint[0],
                            y: startPoint[1] - height / 2,
                            width: endPoint[0] - startPoint[0],
                            height: height,
                        },
                        {
                            // Bounding box of the current cooridinate system (cartesian).
                            x: params.coordSys.x,
                            y: params.coordSys.y,
                            width: params.coordSys.width,
                            height: params.coordSys.height,
                        },
                    );

                    // Returns definitions for the current `dataItem`.
                    return (
                        rectShape && {
                            // 'rect' indicates that the graphic element is rectangular.
                            // Can also be 'circle', 'sector', 'polygon', ...
                            type: 'rect',
                            shape: rectShape,
                            // `api.style(...)` is used to obtain style settings, which
                            // includes itemStyle settings in optino and the result of
                            // visual mapping.
                            style: api.style(),
                        }
                    );
                },
                data: [
                    [12, 44, 55, 60], // The first dataItem.
                    [53, 31, 21, 56], // The second dataItem.
                    [71, 33, 10, 20], // The third dataItem.
                ],
            },
        ],
    };

    return <ReactECharts option={options} />;
}

export default function GanttChartForTestEntities(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: testRun } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const [showEntity, setShowEntity] = useState<boolean>(false);
    const [toShowTestID, setTestID] = useState<string>();
    const [showRetries, setShowRetries] = useState<boolean>(true);

    if (testRun == null || suites == null) {
        return <></>;
    }
    const data = suites['@order']
        .filter(
            (suiteID) => suites[suiteID].standing !== 'RETRIED' || showRetries,
        )
        .map((suiteID, index, reference) => {
            const current = suites[suiteID];
            let dependentOn = current.parent;

            if (index > 0) {
                const previous = suites[reference[index - 1]];
                if (current.parent !== '' && previous.parent === current.parent)
                    dependentOn = previous.suiteID;
            }

            return {
                name:
                    current.standing === 'RETRIED'
                        ? `${current.title} [OLD RETRY]`
                        : current.title,
                description: current.description,
                parent: current.parent,
                id: suiteID,
                start: dayjs(current.started).valueOf(),
                end: dayjs(current.ended).valueOf(),
                dependency: dependentOn,
                duration: current.duration / 1e3,
                completed: {
                    amount: Number((current.passed / current.tests).toFixed(2)),
                },
            };
        });

    const suitesX = suites['@order'].filter(
        (suiteID) => suites[suiteID].standing !== 'RETRIED' || showRetries,
    );
    const helperToSetTestID = (testID: string): void => {
        setTestID(testID);
        setShowEntity(true);
    };

    return (
        <Card
            size="small"
            bordered
            style={{
                marginLeft: '6px',
                marginRight: '12px',
                marginTop: '12px',
            }}
        >
            <Affix
                style={{
                    position: 'absolute',
                    right: '20px',
                    top: '10px',
                    zIndex: 2,
                }}
            >
                <Switch
                    checkedChildren={<>Show Retries</>}
                    unCheckedChildren={<>Hide Retries</>}
                    checked={showRetries}
                    onChange={(checked) => setShowRetries(checked)}
                />
            </Affix>

            <TimelineChart
                // data={data}
                y={suitesX.map((suite) => suites[suite].title)}
                times={suitesX.map((suite) => [
                    dayjs(suites[suite].started).toDate().getTime(),
                    dayjs(suites[suite].ended).toDate().getTime(),
                ])}
                helper={helperToSetTestID}
                projectName={testRun.projectName}
                changeObserved={showRetries}
            />
            <TestEntityDrawer
                open={showEntity}
                onClose={(): void => {
                    setShowEntity(false);
                }}
                testID={toShowTestID}
                setTestID={helperToSetTestID}
            />
        </Card>
    );
}
