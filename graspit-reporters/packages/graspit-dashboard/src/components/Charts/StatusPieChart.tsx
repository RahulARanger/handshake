import type TestRunRecord from 'src/types/testRunRecords';
import type { SuiteSummary } from 'src/types/testRunRecords';
import React, { type ReactNode } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Highcharts3d from 'highcharts/highcharts-3d';
import highContrastDark from 'highcharts/themes/high-contrast-dark';
import { greenGradient, redGradient, skippedGradient } from './constants';
import { toolTipFormats } from '../utils/counter';

if (typeof Highcharts === 'object') {
    Highcharts3d(Highcharts);
    highContrastDark(Highcharts);
}

export default function ProgressPieChart(props: {
    run: TestRunRecord;
    isTestCases: boolean;
}): ReactNode {
    const suite: SuiteSummary = JSON.parse(props.run.suiteSummary);
    const total = props.isTestCases ? props.run.tests : suite.count;

    const _overallPassed =
        (props.isTestCases ? props.run.passed : suite.passed) / total;
    const passPercent = Number.isNaN(_overallPassed) ? 0 : _overallPassed;

    const options: Highcharts.Options = {
        credits: { enabled: false, text: 'link-to-docs-in-future' },
        exporting: { enabled: false },

        chart: {
            type: 'pie',
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0,
                fitToPlot: true,
            },
            backgroundColor: 'transparent',
            height: 185,
            shadow: true,
        },
        tooltip: toolTipFormats,
        title: {
            text: `${(passPercent * 100).toFixed(2)}%`,
            verticalAlign: 'middle',
            style: {
                fontSize: '12',
                color: 'white',
            },
        },
        subtitle: {
            text: undefined,
        },
        plotOptions: {
            pie: {
                shadow: {
                    offsetX: 0,
                    offsetY: 5,
                    opacity: 0.2,
                    width: 5,
                },
                innerSize: 90,
                depth: 15,
                colors: [greenGradient, redGradient, skippedGradient],
            },
        },
        series: [
            {
                type: 'pie',
                name: !props.isTestCases ? 'Suite Entities' : 'Test Entities',
                data: [
                    [
                        'Passed',
                        props.isTestCases ? props.run.passed : suite.passed,
                    ],
                    [
                        'Failed',
                        props.isTestCases ? props.run.failed : suite.failed,
                    ],
                    [
                        'Skipped',
                        props.isTestCases ? props.run.skipped : suite.skipped,
                    ],
                ],
                dataLabels: {
                    style: {
                        textOutline: '0px',
                        color: 'white',
                    },
                    alignTo: 'center',
                    distance: 10,
                },
            },
        ],
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
