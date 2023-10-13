import { type Dayjs } from 'dayjs';
import React, { type CSSProperties, type ReactNode } from 'react';
import { type Duration } from 'dayjs/plugin/duration';
import type { statusOfEntity } from 'src/types/sessionRecords';
import CheckCircleFilled from '@ant-design/icons/CheckCircleFilled';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import WarningFilled from '@ant-design/icons/WarningFilled';
import Icon from '@ant-design/icons';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import type { possibleEntityNames } from 'src/types/sessionRecords';
import Chrome from '../../../public/chrome.svg';
import Firefox from '../../../public/firefox.svg';
import Edge from '../../../public/edge.svg';
import Windows from '../../../public/windows.svg';
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
    const style = { fontSize: 20 };

    switch (props.entityName as possibleEntityNames) {
        case 'chrome': {
            return <Icon component={Chrome} style={style} />;
        }
        case 'firefox': {
            return <Icon component={Firefox} style={style} />;
        }
        case 'edge': {
            return <Icon component={Edge} style={style} />;
        }
        default: {
            return <>{props.entityName?.toLocaleUpperCase()}</>;
        }
    }
}

export function RenderSystemType(props: { systemName: string }): ReactNode {
    const style = { fontSize: 40 };

    const target = props.systemName.toLowerCase();

    if (target.startsWith('win'))
        return <Icon title="System Name" component={Windows} style={style} />;
    return <>{target.toLocaleUpperCase()}</>;
}
