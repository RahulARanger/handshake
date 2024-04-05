import { AreaChart } from '@mantine/charts';
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
            series={[{ name: 'Duration', color: 'indigo.6' }]}
            valueFormatter={(value) =>
                value > 60
                    ? `${Number(Number(value / 60).toFixed(2))}min`
                    : `${value}s`
            }
            withXAxis={false}
            withDots
            curveType="bump"
        />
    );
}
