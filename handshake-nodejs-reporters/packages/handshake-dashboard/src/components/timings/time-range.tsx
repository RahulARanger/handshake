import type { TextProps } from '@mantine/core';
import { Text, Tooltip } from '@mantine/core';
import { timeFormatUsed } from 'components/datetime/format';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import React from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function TimeRange(properties: {
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    size?: TextProps['size'];
}): ReactNode {
    return (
        <Tooltip
            label={`${properties.startTime.format(timeFormatUsed)} - ${properties.endTime.format(timeFormatUsed)}`}
        >
            <Text size={properties.size ?? 'sm'}>
                {properties.endTime.fromNow()}
            </Text>
        </Tooltip>
    );
}
