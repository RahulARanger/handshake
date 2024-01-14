import { type Dayjs } from 'dayjs';
import React, { type CSSProperties, type ReactNode } from 'react';
import { type Duration } from 'dayjs/plugin/duration';
import RelativeTo, { HumanizeDuration } from './Datetime/relative-time';

export default function RenderTimeRelativeToStart(properties: {
    value?: [Dayjs, Dayjs];
    style?: CSSProperties;
    autoPlay?: boolean;
}): ReactNode {
    if (properties.value == undefined) return <></>;
    return (
        <RelativeTo
            dateTime={properties.value[0]}
            wrt={properties.value[1]}
            style={properties.style}
            autoPlay={properties.autoPlay}
        />
    );
}

export function RenderDuration(properties: {
    value: Duration;
    style?: CSSProperties;
    autoPlay?: boolean;
    maxWidth?: string;
}): ReactNode {
    return (
        <HumanizeDuration
            duration={properties.value}
            style={properties.style}
            autoPlay={properties.autoPlay}
            maxWidth={properties.maxWidth ?? '90px'}
        />
    );
}
