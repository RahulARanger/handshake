import React, { useState, useContext, type ReactNode } from 'react';
import type { SuiteDetails } from 'src/types/generatedResponse';
import type TestRunRecord from 'src/types/testRunRecords';
import useSWR from 'swr';
import HighchartsReact from 'highcharts-react-official';
import HighChartsAccessibility from 'highcharts/modules/accessibility';
import Switch from 'antd/lib/switch';
import HighChartsForGantt, {
    type PointClickEventObject,
} from 'highcharts/highcharts-gantt';
import HighchartsGantt from 'highcharts/modules/gantt';
import brandDark from 'highcharts/themes/brand-dark';

import dayjs from 'dayjs';
import 'src/styles/highChartExternal.module.css';
import MetaCallContext from '../core/TestRun/context';
import { toolTipFormats } from '../utils/counter';
import { getSuites, getTestRun } from '../scripts/helper';
import Card from 'antd/lib/card/Card';
import Affix from 'antd/lib/affix/index';

import { REM } from 'next/font/google';
import TestEntityDrawer from '../core/TestEntity';

const serif = REM({
    subsets: ['latin'],
    weight: '300',
    adjustFontFallback: true,
});

if (typeof HighChartsForGantt === 'object') {
    HighchartsGantt(HighChartsForGantt);
    brandDark(HighChartsForGantt);
    HighChartsAccessibility(HighChartsForGantt);
}

class TimelineChart extends React.Component<{
    data: Highcharts.GanttPointOptionsObject[];
    helper: (id: string) => void;
    projectName: string;
    changeObserved: boolean;
}> {
    state = { options: {} };
    chart = React.createRef<HighchartsReact.RefObject>();

    componentDidMount(): void {
        const options: Highcharts.Options = {
            chart: {
                type: 'gantt',
                plotShadow: true,
                className: 'highcharts-dark',
                backgroundColor: 'transparent',
                style: { fontFamily: serif.style.fontFamily, color: 'white' },
            },
            credits: { enabled: false },
            title: {
                text: `${this.props.projectName}::Gantt Chart`,
                align: 'left',
                style: {
                    fontSize: '1.35rem',
                },
            },
            subtitle: {
                text: '<small>Suites are displayed in chronological order</small>',
                align: 'left',
                style: {
                    fontSize: '.69rem',
                },
            },

            navigator: {
                enabled: true,
                series: {
                    type: 'gantt',
                    accessibility: {
                        enabled: false,
                    },
                },
                yAxis: {
                    min: 0,
                    max: 3,
                    reversed: true,
                    categories: [],
                },
            },
            xAxis: [
                {
                    currentDateIndicator: {
                        color: '#2caffe',
                        dashStyle: 'ShortDot',
                        width: 2,
                        label: {
                            format: '',
                        },
                    },
                    dateTimeLabelFormats: {
                        day: '%e<br><span style="opacity: 0.5; font-size: 0.7em">%a</span>',
                    },
                    grid: {
                        borderWidth: 0,
                    },
                    gridLineWidth: 1,
                },
            ],
            yAxis: {
                grid: {
                    borderWidth: 0,
                },
                gridLineWidth: 0,
                staticScale: 31,
                visible: false,
            },
            tooltip: {
                pointFormat:
                    '<span style="font-weight: bold;">{point.name}</span><br>' +
                    '{point.start:%H:%M}' +
                    '{#unless point.milestone} → {point.end:%H:%M}{/unless}' +
                    '&nbsp;({point.duration} s)<br>',
                ...toolTipFormats,
            },
            series: [
                {
                    borderRadius: 3.69,
                    type: 'gantt',
                    name: this.props.projectName,
                    data: this.props.data,
                    cursor: 'pointer',
                    dataLabels: {
                        padding: 10,
                        style: {
                            fontWeight: 'normal',
                            textOutline: 'none',
                            fontSize: '.69rem',
                        },
                    },

                    point: {
                        events: {
                            click: (event: PointClickEventObject) => {
                                this.props.helper(event.point.options.id ?? '');
                            },
                        },
                    },
                },
            ],
        };
        this.setState({ options });
    }
    componentDidUpdate(
        prevProps: Readonly<{
            data: Highcharts.GanttPointOptionsObject[];
            helper: (id: string) => void;
            projectName: string;
            changeObserved: boolean;
        }>,
    ): void {
        if (prevProps.changeObserved !== this.props.changeObserved) {
            // this.chart.current?.chart.series[0].update({
            //     data: this.props.data,
            // });
        }
    }

    render(): React.ReactNode {
        return (
            <HighchartsReact
                ref={this.chart}
                highcharts={HighChartsForGantt}
                options={this.state.options}
                constructorType="ganttChart"
            />
        );
    }
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
    const data: HighChartsForGantt.GanttPointOptionsObject[] = suites['@order']
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
                data={data}
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
