import type { TextProps } from '@mantine/core';
import { Text } from '@mantine/core';
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
        <DurationText
            prefix={properties.prefix}
            seconds={properties.duration.asSeconds()}
        />
    );
}

function addS(number_: number): string {
    return number_ > 1 ? 's' : '';
}

export function durationText(seconds: number): string {
    if (seconds < 0) {
        return `${seconds * 1000} ms`;
    }

    if (seconds >= 3600) {
        const value = Number(Number(seconds / 3600).toFixed(2));
        return `${value}hr${addS(value)}`;
    }

    const mins = Number(Number(seconds / 60).toFixed(2));
    return seconds > 60
        ? `${mins}min${addS(mins)}`
        : `${seconds}s${addS(seconds)}`;
}

export function DurationText(properties: {
    seconds: number;
    prefix?: string;
}): ReactNode {
    let seconds = properties.seconds;
    let valueToShow = 0;
    let suffix = '';
    let label = `${properties.seconds} second${addS(properties.seconds)}`;
    if (seconds < 0) {
        valueToShow = seconds * 1000;
        suffix = 'ms';
    } else if (seconds >= 3600) {
        valueToShow = Number((seconds / 3600).toFixed(2));
        suffix = 'hr';
    } else if (seconds > 60) {
        valueToShow = Number((seconds / 60).toFixed(2));
        suffix = 'min';
    } else {
        valueToShow = Number(seconds.toFixed(2));
        suffix = 'sec';
    }
    if (true) {
        label = '';
        let tSuffix = '';
        let tValueToShow = 0;

        if (seconds >= 3600) {
            tValueToShow = Number((seconds / 3600).toFixed(2));
            tSuffix = 'hr';
            seconds -= tValueToShow * 3600;
            label += tValueToShow + ' ' + tSuffix + addS(tValueToShow) + ' ';
        }
        if (seconds > 60) {
            tValueToShow = Number((seconds / 60).toFixed(2));
            tSuffix = 'min';
            seconds -= tValueToShow * 60;
            label += tValueToShow + ' ' + tSuffix + addS(tValueToShow) + ' ';
        }
        if (seconds > 1) {
            tSuffix = 'sec';
            tValueToShow = Number(seconds.toFixed(2));
            label += tValueToShow + ' ' + tSuffix + addS(tValueToShow);
        }
        if (seconds < 0) {
            tValueToShow = seconds * 1000;
            tSuffix = 'ms';
            label += tValueToShow + ' ' + tSuffix + addS(tValueToShow) + ' ';
        }
    }

    return (
        <Text title={label}>
            {properties.prefix ?? ''}
            {valueToShow}&nbsp;
            <Text size="xs" component="span">
                {suffix + addS(valueToShow)}
            </Text>
        </Text>
    );
}
