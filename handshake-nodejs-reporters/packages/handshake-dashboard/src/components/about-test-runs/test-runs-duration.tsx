import { AreaChart } from '@mantine/charts';
import { durationText } from 'components/timings/humanized-duration';
import type { ReactNode } from 'react';
import React from 'react';

export default function AreaWithTestRunDuration(properties: {
    durations: number[];
}): ReactNode {
    return (
        <AreaChart
            h={100}
            data={properties.durations.map((_) => ({ Duration: _ }))}
            dataKey="date"
            dotProps={{ r: 2, strokeWidth: 1 }}
            strokeWidth={1}
            series={[{ name: 'Duration', color: 'indigo.6' }]}
            valueFormatter={durationText}
            withXAxis={false}
            withDots
            curveType="bump"
        />
    );
}
