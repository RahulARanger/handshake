import { type Dayjs } from 'dayjs';
import React, { type CSSProperties, type ReactNode } from 'react';
import { type Duration } from 'dayjs/plugin/duration';
import type { statusOfEntity } from 'src/types/sessionRecords';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import WarningFilled from '@ant-design/icons/WarningFilled';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import type { possibleEntityNames } from 'src/types/sessionRecords';
import Avatar from 'antd/lib/avatar/avatar';
import RelativeTo, { HumanizeDuration } from './Datetime/relativeTime';

export default function RenderTimeRelativeToStart(props: {
    value?: [Dayjs, Dayjs];
    style?: CSSProperties;
}): ReactNode {
    if (props.value == null) return <></>;
    return (
        <RelativeTo
            dateTime={props.value[0]}
            wrt={props.value[1]}
            style={props.style}
        />
    );
}

export function RenderDuration(props: {
    value: Duration;
    style?: CSSProperties;
}): ReactNode {
    return <HumanizeDuration duration={props.value} style={props.style} />;
}

export function RenderStatus(props: { value: string }): ReactNode {
    switch (props.value as statusOfEntity) {
        case 'PASSED': {
            return (
                <CheckCircleFilled
                    style={{ fontSize: '16px', color: 'green' }}
                    title="Passed"
                />
            );
        }
        case 'FAILED': {
            return (
                <CloseOutlined
                    spin
                    style={{ fontSize: '16px', color: 'red' }}
                    title="Failed"
                />
            );
        }
        case 'SKIPPED': {
            return (
                <WarningFilled
                    style={{ fontSize: '16px', color: 'yellow' }}
                    spin
                    title="Skipped"
                />
            );
        }
        case 'PENDING': {
            return (
                <LoadingOutlined
                    style={{ fontSize: '16px', color: 'yellow' }}
                    title="Pending"
                />
            );
        }
    }
}

export function RenderEntityType(props: { entityName: string }): ReactNode {
    switch (props.entityName.toLowerCase() as possibleEntityNames) {
        case 'chrome': {
            return <Avatar src={'/chrome.png'} size="small" />;
        }
        case 'firefox': {
            return <Avatar src={'/firefox.png'} size="small" />;
        }
        case 'edge': {
            return <Avatar src={'/edge.png'} size="small" />;
        }
        default: {
            return <>{props.entityName?.toLocaleUpperCase()}</>;
        }
    }
}

export function RenderSystemType(props: { systemName: string }): ReactNode {
    const target = props.systemName.toLowerCase();

    if (target.startsWith('win'))
        return <Avatar src={'/windows.png'} size="large" />;
    else if (target.startsWith('mac'))
        return <Avatar src={'/mac.png'} size="large" />;
    return <>{target.toLocaleUpperCase()}</>;
}
