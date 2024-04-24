import type { TextProps } from '@mantine/core';
import { Tooltip, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';
import Duration from 'dayjs/plugin/duration';
import type { Duration as durationType } from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';

dayjs.extend(relativeTime);
dayjs.extend(Duration);

export function HumanizedDuration(properties: {
    duration: durationType;
    prefix?: string;
    size?: TextProps['size'];
}): ReactNode {
    return (
        <Tooltip
            color="purple"
            label={durationText(properties.duration.asSeconds())}
        >
            <Text size={properties.size ?? 'sm'}>
                {`${properties.prefix ?? ''}${properties.duration.humanize(!properties.prefix)}`}
            </Text>
        </Tooltip>
    );
}

export function durationText(seconds: number): string {
    if (seconds >= 3600) {
        return `${Number(Number(seconds / 3600).toFixed(2))}hr`;
    }

    return seconds > 60
        ? `${Number(Number(seconds / 60).toFixed(2))}min`
        : `${seconds}s`;
}
