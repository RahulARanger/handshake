import { type Dayjs } from 'dayjs';
import React, { type CSSProperties, type ReactNode } from 'react';
import { type Duration } from 'dayjs/plugin/duration';
import type { statusOfEntity } from 'src/types/session-records';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import WarningFilled from '@ant-design/icons/WarningFilled';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import type { possibleEntityNames } from 'src/types/session-records';
import Avatar from 'antd/lib/avatar/avatar';
import RelativeTo, { HumanizeDuration } from './Datetime/relative-time';

export default function RenderTimeRelativeToStart(properties: {
    value?: [Dayjs, Dayjs];
    style?: CSSProperties;
}): ReactNode {
    if (properties.value == undefined) return <></>;
    return (
        <RelativeTo
            dateTime={properties.value[0]}
            wrt={properties.value[1]}
            style={properties.style}
        />
    );
}

export function RenderDuration(properties: {
    value: Duration;
    style?: CSSProperties;
}): ReactNode {
    return (
        <HumanizeDuration
            duration={properties.value}
            style={properties.style}
        />
    );
}

export function RenderStatus(properties: {
    value: string;
    marginTop?: string;
}): ReactNode {
    switch (properties.value as statusOfEntity) {
        case 'PASSED': {
            return (
                <CheckCircleFilled
                    style={{
                        fontSize: '16px',
                        color: 'green',
                        marginTop: properties.marginTop,
                    }}
                    title="Passed"
                />
            );
        }
        case 'FAILED': {
            return (
                <CloseOutlined
                    spin
                    style={{
                        fontSize: '16px',
                        color: 'red',
                        marginTop: properties.marginTop,
                    }}
                    title="Failed"
                />
            );
        }
        case 'SKIPPED': {
            return (
                <WarningFilled
                    style={{
                        fontSize: '16px',
                        color: 'yellow',
                        marginTop: properties.marginTop,
                    }}
                    title="Skipped"
                />
            );
        }
        case 'PENDING': {
            return (
                <LoadingOutlined
                    style={{
                        fontSize: '16px',
                        color: 'yellow',
                        marginTop: properties.marginTop,
                    }}
                    title="Pending"
                />
            );
        }
        case 'RETRIED': {
            return (
                <ReloadOutlined
                    style={{
                        fontSize: '16px',
                        color: 'orangered',
                        marginTop: properties.marginTop,
                    }}
                    spin
                    title="Retried Suite"
                />
            );
        }
    }
}

export function RenderEntityType(properties: {
    entityName: string;
}): ReactNode {
    const note = properties.entityName.toLowerCase() as possibleEntityNames;

    if (note.includes('chrome'))
        return <Avatar src={'/chrome.png'} size="small" />;
    if (note.includes('firefox'))
        return <Avatar src={'/firefox.png'} size="small" />;
    if (note.includes('edge')) return <Avatar src={'/edge.png'} size="small" />;
    return <>{properties.entityName?.toLocaleUpperCase()}</>;
}

export function RenderSystemType(properties: {
    systemName: string;
}): ReactNode {
    const target = properties.systemName.toLowerCase();

    if (target.startsWith('win'))
        return <Avatar src={'/windows.png'} size="large" />;
    else if (target.startsWith('mac'))
        return <Avatar src={'/mac.png'} size="large" />;
    return <>{target.toLocaleUpperCase()}</>;
}
