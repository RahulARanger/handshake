import React, { useContext, type ReactNode } from 'react';
import { getSuites, getTestRun } from 'src/Generators/helper';
import type { SuiteDetails } from 'src/types/generatedResponse';
import type TestRunRecord from 'src/types/testRunRecords';
import useSWR from 'swr';
import HighchartsReact from 'highcharts-react-official';
import HighChartsAccessibility from 'highcharts/modules/accessibility';
import HighChartsForGantt, {
    type PointClickEventObject,
} from 'highcharts/highcharts-gantt';
import HighchartsGantt from 'highcharts/modules/gantt';
import brandDark from 'highcharts/themes/brand-dark';

import dayjs from 'dayjs';
import 'src/styles/highChartExternal.module.css';
import MetaCallContext from '../core/TestRun/context';
import { toolTipFormats } from '../utils/counter';

if (typeof HighChartsForGantt === 'object') {
    HighchartsGantt(HighChartsForGantt);
    brandDark(HighChartsForGantt);
    HighChartsAccessibility(HighChartsForGantt);
}

export default function GanttChartForTestEntities(props: {
    setOpenDrilldown: (id: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: testRun } = useSWR<TestRunRecord>(getTestRun(port, testID));

    if (testRun == null || suites == null) {
        return <></>;
    }

    const data: HighChartsForGantt.GanttPointOptionsObject[] = suites[
        '@order'
    ].map((suiteID, index, reference) => {
        const current = suites[suiteID];
        let dependentOn = current.parent;

        if (index > 0) {
            const previous = suites[reference[index - 1]];
            if (current.parent !== '' && previous.parent === current.parent)
                dependentOn = previous.suiteID;
        }

        return {
            name: current.title,
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

    // THE CHART
    const options: Highcharts.Options = {
        chart: {
            type: 'gantt',
            plotShadow: true,
            className: 'highcharts-dark',
            backgroundColor: 'rgba(128,128,128,0.02)',
        },
        credits: { enabled: false },
        title: {
            text: `${testRun.projectName}::Gantt Chart`,
            align: 'left',
            style: {
                fontSize: '1.35rem',
            },
        },
        subtitle: {
            text: '<small>Please find your suites here</small>',
            align: 'left',
            style: {
                fontSize: '.89rem',
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
        },
        tooltip: {
            pointFormat:
                '<span style="font-weight: bold;">{point.name}</span><br>' +
                '{point.start:%M:%S}' +
                '{#unless point.milestone} → {point.end:%M:%S}{/unless}' +
                '&nbsp;({point.duration} s)<br>',
            ...toolTipFormats,
        },
        series: [
            {
                type: 'gantt',
                name: testRun.projectName,
                data,
                cursor: 'pointer',
                point: {
                    events: {
                        click: function (event: PointClickEventObject) {
                            props.setOpenDrilldown(
                                event.point.options.id ?? '',
                            );
                        },
                    },
                },
            },
        ],
    };

    return (
        <HighchartsReact
            highcharts={HighChartsForGantt}
            options={options}
            constructorType="ganttChart"
        />
    );
}
