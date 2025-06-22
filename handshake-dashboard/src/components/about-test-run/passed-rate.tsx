import { Progress, rem, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';

export default function PassedRate(properties: {
    rate: [number, number, number, number, number];
    width?: number | string;
    text: string;
    minWidth?: number | string;
    height?: number;
}): ReactNode {
    const total =
        properties.rate[0] +
        properties.rate[1] +
        properties.rate[2] +
        properties.rate[3] +
        properties.rate[4];
    const toPercent = (_: number) => Number(((_ / total) * 100).toFixed(2));
    return (
        <Progress.Root
            size="xl"
            h={properties.height}
            style={{
                minWidth: properties.minWidth,
                width: rem(properties.width ?? 200),
                textAlign: 'center',
            }}
        >
            {[
                ['Passed', 'green'],
                ['Failed', 'red'],
                ['Skipped', 'yellow'],
                ['XFailed', 'orange'],
                ['XPassed', 'blue'],
            ].map(([label, color], index) => (
                <Tooltip
                    label={`${label} ${properties.text} - ${properties.rate[index]} - ${toPercent(properties.rate[index]) + '%'}`}
                    color={color}
                    key={label}
                >
                    <Progress.Section
                        striped={
                            color === 'red' ||
                            color === 'green' ||
                            color === 'blue'
                        }
                        value={toPercent(properties.rate[index])}
                        color={color}
                        animated={color === 'red'}
                    >
                        <Progress.Label>
                            {toPercent(properties.rate[index]) + '%'}
                        </Progress.Label>
                    </Progress.Section>
                </Tooltip>
            ))}
        </Progress.Root>
    );
}
