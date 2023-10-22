import type TestRunRecord from 'src/types/testRunRecords';
import React, { type ReactNode } from 'react';
import Highcharts from 'highcharts';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import dayjs from 'dayjs';
import brandDark from 'highcharts/themes/brand-dark';
import DayJSUtc from 'dayjs/plugin/utc';
import DayJSTimezone from 'dayjs/plugin/timezone';
import { statusColors } from '../parseUtils';

dayjs.extend(DayJSUtc);
dayjs.extend(DayJSTimezone);

if (typeof Highcharts === 'object') {
    HighchartsExporting(Highcharts);
    brandDark(Highcharts);
}

export default function AreaChartsForRuns(props: {
    runs: TestRunRecord[];
    showTest: boolean;
}): ReactNode {
    const text = props.showTest ? 'Tests' : 'Suites';

    const options: Highcharts.Options = {
        chart: {
            type: 'area',
            plotShadow: true,
            backgroundColor: 'rgba(128,128,128,0.02)',
        },
        colors: statusColors,
        title: {
            useHTML: true,
            text: `Cumulative ${text} Results Over Time`,
            align: 'left',
        },
        subtitle: {
            text:
                '<a href="https://energiogklima.no/klimavakten/land-med-hoyest-utslipp/"' +
                'target="_blank">Reference</a>',
            align: 'left',
        },
        xAxis: {
            type: 'datetime',
            labels: {
                format: '{value:%d-%m %I:%M %p}',
            },
            title: {
                useHTML: true,
                text: 'Start Date_Time (<em>month:day hr:min AM/PM</em>)',
            },
            tickInterval: 1000 * 60 * 60,
        },
        yAxis: {
            title: {
                text: 'Freq.',
            },
        },
        tooltip: {
            enabled: true,
            shared: true,
            pointFormat:
                '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        },
        plotOptions: {
            area: {
                stacking: 'normal',
                shadow: true,
                lineColor: '#666666',
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: '#666666',
                },
            },
        },
        credits: { enabled: false },
        series: [
            {
                type: 'area',
                name: 'Passed',
                data: props.runs.map((run) => [
                    dayjs.utc(run.started).utcOffset(0, true).valueOf(),
                    props.showTest
                        ? run.passed
                        : JSON.parse(run.suiteSummary).passed,
                ]),
            },
            {
                type: 'area',
                name: 'Failed',
                data: props.runs.map((run) => [
                    dayjs.utc(run.started).utcOffset(0, true).valueOf(),
                    props.showTest
                        ? run.failed
                        : JSON.parse(run.suiteSummary).failed,
                ]),
            },
            {
                type: 'area',
                name: 'Skipped',
                data: props.runs.map((run) => [
                    dayjs.utc(run.started).utcOffset(0, true).valueOf(),
                    props.showTest
                        ? run.skipped
                        : JSON.parse(run.suiteSummary).skippeds,
                ]),
            },
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
