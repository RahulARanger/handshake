import type { TextProps } from '@mantine/core';
import { Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import React from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';
import { timeFormatUsed } from './format';

dayjs.extend(relativeTime);

export function TimeRange(properties: {
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    size?: TextProps['size'];
    detailed?: boolean;
    relativeFrom?: dayjs.Dayjs;
    cn?: string;
}): ReactNode {
    const rangeText = `${properties.startTime.format(timeFormatUsed)} - ${properties.endTime.format(timeFormatUsed)}`;
    const relative = properties.relativeFrom
        ? properties.endTime.from(properties.relativeFrom) +
          ` relative from ${properties.relativeFrom.format(timeFormatUsed)}`
        : properties.startTime.fromNow();

    return (
        <Tooltip
            label={properties.detailed ? relative : rangeText}
            color="blue"
            className={properties.cn}
        >
            <Text size={properties.size ?? 'sm'}>
                {properties.detailed ? rangeText : relative}
            </Text>
        </Tooltip>
    );
}
