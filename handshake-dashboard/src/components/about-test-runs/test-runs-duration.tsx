import { AreaChart } from '@mantine/charts';
import { durationText } from 'components/timings/humanized-duration';
import type { ReactNode } from 'react';
import React from 'react';

export default function AreaWithTestRunDuration(properties: {
    runs: Array<{ duration: number; id: string }>;
}): ReactNode {
    return (
        <AreaChart
            h={100}
            data={properties.runs.map((_) => ({
                Duration: _.duration,
                Id: _.id,
            }))}
            dataKey="date"
            dotProps={{ r: 2, strokeWidth: 1 }}
            strokeWidth={1}
            left={20}
            series={[{ name: 'Duration', color: 'indigo.6' }]}
            valueFormatter={durationText}
            withXAxis={false}
            withDots
            curveType="bump"
            classNames={{ tooltip: 'mirror' }}
            areaProps={{ isAnimationActive: true }}
            areaChartProps={{ syncId: 'Id' }}
        />
    );
}
