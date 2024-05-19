import { RingProgress, Skeleton, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import React, { useState } from 'react';

export default function TestStatusRing(properties: {
    labelText: string;
    rateValues?: number[];
    totalEntity?: number;
    onHovered?: (section: number) => void;
    toLoad?: boolean;
}): ReactNode {
    const colors = ['green', 'red', 'yellow'];
    const tips = ['Passed', 'Failed', 'Skipped'];
    const rateValues = properties.rateValues as number[];
    const totalEntity = properties.totalEntity as number;
    const [hovered, setHovered] = useState<undefined | number>();
    const reset = () => setHovered(undefined);

    return properties.toLoad ? (
        <Skeleton circle height={205} animate m="lg" color="orange" />
    ) : (
        <RingProgress
            size={250}
            label={
                <Text
                    size="sm"
                    ta="center"
                    px="xs"
                    style={{
                        pointerEvents: 'none',
                    }}
                    c={colors[hovered ?? 0]}
                >
                    <b>{`${Number(((rateValues[hovered ?? 0] / totalEntity) * 1e2).toFixed(2))}% `}</b>
                    <sub>[{rateValues[hovered ?? 0]}]</sub>
                    {` of ${properties.labelText} have ${tips[hovered ?? 0]}.`}
                </Text>
            }
            thickness={25}
            onMouseLeave={() => setHovered(undefined)}
            sections={rateValues.map((value, index) => ({
                value: (value / totalEntity) * 100,
                color: colors[index],
                tooltip: tips[index],
                onMouseEnter: () => setHovered(index),
                onMouseLeave: reset,
                style: {
                    cursor: 'pointer',
                },
            }))}
        />
    );
}
