import type { AreaChartProps } from '@mantine/charts';
import { AreaChart } from '@mantine/charts';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import React from 'react';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

export default function AreaChartForTestRuns(properties: {
    Rates: Array<{ rate: [number, number, number]; date: Dayjs; id: string }>;
    percentStack?: boolean;
    w?: AreaChartProps['w'];
}): ReactNode {
    let currentDate: Dayjs | undefined;

    return (
        <AreaChart
            h={350}
            w={properties.w ?? 600}
            type={properties.percentStack ? 'percent' : 'default'}
            dotProps={{ r: 2, strokeWidth: 1 }}
            strokeWidth={1}
            legendProps={{ verticalAlign: 'bottom', height: 50 }}
            data={properties.Rates.map(
                (
                    _,
                ): {
                    Passed: number;
                    Failed: number;
                    Skipped: number;
                    date: string;
                    Id: string;
                } => {
                    const showDate =
                        !currentDate || !currentDate.isSame(_.date, 'date');
                    if (showDate) currentDate = _.date;

                    return {
                        Passed: _.rate[0],
                        Failed: _.rate[1],
                        Skipped: _.rate[2],
                        date: _.date.format(
                            showDate ? 'Do MMM, hh:mm a' : 'hh:mm a',
                        ),
                        Id: _.id,
                    };
                },
            )}
            withGradient
            withLegend
            withTooltip
            withDots
            dataKey="date"
            series={[
                { name: 'Passed', color: 'green' },
                { name: 'Skipped', color: 'yellow' },
                { name: 'Failed', color: 'red' },
            ]}
            areaProps={{ isAnimationActive: true }}
            areaChartProps={{ syncId: 'Id' }}
        />
    );
}
