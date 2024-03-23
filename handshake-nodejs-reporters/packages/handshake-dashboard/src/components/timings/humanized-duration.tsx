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
    const inMinutes = Number(properties.duration.asMinutes().toFixed(2));
    const inSeconds = Number(properties.duration.asSeconds().toFixed(2));

    return (
        <Tooltip
            color="purple"
            label={inMinutes > 1 ? `${inMinutes} min` : `${inSeconds} s`}
        >
            <Text size={properties.size ?? 'sm'}>
                {`${properties.prefix ?? ''}${properties.duration.humanize(!properties.prefix)}`}
            </Text>
        </Tooltip>
    );
}
