import type TestRunRecord from 'src/types/testRunRecords';
import type { SuiteSummary } from 'src/types/testRunRecords';
import React, { type ReactNode } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highContrastDark from 'highcharts/themes/high-contrast-dark';
import { greenGradient, redGradient, skippedGradient } from './constants';
import { toolTipFormats } from '../utils/counter';
import { REM } from 'next/font/google';

const serif = REM({
    subsets: ['latin'],
    weight: '300',
    adjustFontFallback: true,
});

if (typeof Highcharts === 'object') {
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
            backgroundColor: 'transparent',
            shadow: true,
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            height: 120,
            style: { fontFamily: serif.style.fontFamily },
        },
        tooltip: toolTipFormats,
        title: {
            text: `${(passPercent * 100).toFixed(2)}%`,
            x: -20,
            y: 40,
            align: 'center',
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
                colors: [greenGradient, redGradient, skippedGradient],
                startAngle: -90,
                endAngle: 90,
                center: ['43%', '100%'],
                size: '180%',
                borderWidth: 0,
            },
        },
        series: [
            {
                allowPointSelect: false,
                shadow: true,

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
                        fontWeight: 'normal',
                    },
                    alignTo: 'center',
                    distance: 10,
                },
            },
        ],
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
}
