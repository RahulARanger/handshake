import { Progress, rem, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';

export default function PassedRate(properties: {
    rate: [number, number, number];
    width?: number;
    text: string;
}): ReactNode {
    const total = properties.rate[0] + properties.rate[1] + properties.rate[2];
    const toPercent = (_: number) => Number(((_ / total) * 100).toFixed(2));
    return (
        <Progress.Root
            size="xl"
            style={{ width: rem(properties.width ?? 200) }}
        >
            <Tooltip
                label={`Passed ${properties.text} - ${properties.rate[0]} - ${toPercent(properties.rate[0]) + '%'}`}
                color="green"
            >
                <Progress.Section
                    striped
                    value={toPercent(properties.rate[0])}
                    color="green"
                >
                    <Progress.Label>
                        {toPercent(properties.rate[0]) + '%'}
                    </Progress.Label>
                </Progress.Section>
            </Tooltip>

            <Tooltip
                label={`Skipped ${properties.text} - ${properties.rate[2]} - ${toPercent(properties.rate[2]) + '%'}`}
                color="yellow"
            >
                <Progress.Section
                    value={toPercent(properties.rate[2])}
                    color="yellow"
                >
                    <Progress.Label>
                        {toPercent(properties.rate[2]) + '%'}
                    </Progress.Label>
                </Progress.Section>
            </Tooltip>

            <Tooltip
                label={`Failed ${properties.text} - ${properties.rate[1]} - ${toPercent(properties.rate[1]) + '%'}`}
                color="red"
            >
                <Progress.Section
                    value={toPercent(properties.rate[1])}
                    color="red"
                    animated
                >
                    <Progress.Label>
                        {toPercent(properties.rate[1]) + '%'}
                    </Progress.Label>
                </Progress.Section>
            </Tooltip>
        </Progress.Root>
    );
}
