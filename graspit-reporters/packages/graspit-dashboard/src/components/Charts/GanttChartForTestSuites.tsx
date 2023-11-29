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
import MetaCallContext from '../core/TestRun/context';
import { getSuites, getTestRun } from '../scripts/helper';
import useSWR from 'swr';
import { Affix, Switch } from 'antd/lib';
import Card from 'antd/lib/card/Card';
import TestEntityDrawer from '../core/TestEntity';
import type { SuiteDetails } from 'src/types/generatedResponse';
import type TestRunRecord from 'src/types/testRunRecords';

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

function TimelineChart() {
    // props: {
    //     helper: (id: string) => void;
    //     projectName: string;
    //     y: string[];
    //     times: Array<[number, number]>;
    //     changeObserved: boolean;
    // }
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
    // const data = suites['@order']
    //     .filter(
    //         (suiteID) => suites[suiteID].standing !== 'RETRIED' || showRetries,
    //     )
    //     .map((suiteID, index, reference) => {
    //         const current = suites[suiteID];
    //         let dependentOn = current.parent;

    //         if (index > 0) {
    //             const previous = suites[reference[index - 1]];
    //             if (current.parent !== '' && previous.parent === current.parent)
    //                 dependentOn = previous.suiteID;
    //         }

    //         return {
    //             name:
    //                 current.standing === 'RETRIED'
    //                     ? `${current.title} [OLD RETRY]`
    //                     : current.title,
    //             description: current.description,
    //             parent: current.parent,
    //             id: suiteID,
    //             start: dayjs(current.started).valueOf(),
    //             end: dayjs(current.ended).valueOf(),
    //             dependency: dependentOn,
    //             duration: current.duration / 1e3,
    //             completed: {
    //                 amount: Number((current.passed / current.tests).toFixed(2)),
    //             },
    //         };
    //     });

    // const suitesX = suites['@order'].filter(
    //     (suiteID) => suites[suiteID].standing !== 'RETRIED' || showRetries,
    // );
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
            // y={suitesX.map((suite) => suites[suite].title)}
            // times={suitesX.map((suite) => [
            //     dayjs(suites[suite].started).toDate().getTime(),
            //     dayjs(suites[suite].ended).toDate().getTime(),
            // ])}
            // helper={helperToSetTestID}
            // projectName={testRun.projectName}
            // changeObserved={showRetries}
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
