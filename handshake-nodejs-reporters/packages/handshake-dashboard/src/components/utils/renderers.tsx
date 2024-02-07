import type { CSSProperties } from 'react';
import React, { type ReactNode } from 'react';
import type { statusOfEntity } from 'src/types/session-records';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import Dotted from 'src/styles/dotted.module.css';
import Text from 'antd/lib/typography/Text';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Space from 'antd/lib/space';
import Card from 'antd/lib/card/Card';
import Tag from 'antd/lib/tag/index';
import type { possibleEntityNames } from 'src/types/session-records';
import Avatar from 'antd/lib/avatar/avatar';
import GraphCardCss from 'src/styles/GraphCard.module.css';
import { Badge, Tooltip } from 'antd/lib';
import { showOnly } from 'src/types/ui-constants';
import type {
    ParsedSuiteRecord,
    ParsedTestRecord,
} from 'src/types/parsed-records';
import { testStatusText } from '../core/TestEntity/extractors';
import { LOCATORS } from 'handshake-utils';

export function RenderStatus(properties: {
    value: string;
    marginTop?: string;
}): ReactNode {
    switch (properties.value as statusOfEntity) {
        case 'PASSED': {
            return (
                <Text
                    style={{
                        position: 'relative',
                        top: '-1px',
                    }}
                    className={`${showOnly} ${LOCATORS.RUNS.statusForTestEntity}`}
                >
                    ✅
                </Text>
            );
        }
        case 'FAILED': {
            return (
                <Text
                    className={`${Dotted.redGlowText} ${Dotted.spin} ${showOnly} ${LOCATORS.RUNS.statusForTestEntity}`}
                >
                    ❌
                </Text>
            );
        }
        case 'SKIPPED': {
            return (
                <Text
                    className={`${showOnly} ${Dotted.yellowGlowText} ${LOCATORS.RUNS.statusForTestEntity}`}
                    style={{
                        position: 'relative',
                        top: '-1px',
                    }}
                >
                    ⚠️
                </Text>
            );
        }
        case 'PENDING': {
            return (
                <LoadingOutlined
                    style={{
                        fontSize: '16px',
                        color: 'yellow',
                        marginTop: properties.marginTop,
                        borderRadius: '50px',
                    }}
                    title="Pending"
                    className={`warn-glow ${showOnly} ${LOCATORS.RUNS.statusForTestEntity}`}
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
                        borderRadius: '50px',
                    }}
                    spin
                    title="Retried Suite"
                    className={`retried-glow ${showOnly} ${LOCATORS.RUNS.statusForTestEntity}`}
                />
            );
        }
    }
}

function entityIcon(entityName: string) {
    const note = entityName.toLowerCase() as possibleEntityNames;

    if (note.includes('chrome'))
        return <Avatar src={'/chrome.png'} size="small" />;
    if (note.includes('firefox'))
        return <Avatar src={'/firefox.png'} size="small" />;
    if (note.includes('edge')) return <Avatar src={'/edge.png'} size="small" />;
    return <>{entityName?.toLocaleUpperCase()}</>;
}

export function RenderEntityType(properties: {
    entityName: string;
    simplified?: string;
    entityVersion?: string;
}): ReactNode {
    return (
        <Tooltip title={properties.simplified}>
            <Badge
                count={properties.entityVersion?.slice(0, 5)}
                color="transparent"
                size="small"
                overflowCount={200}
                style={{
                    top: -3,
                    borderColor: 'transparent',
                    right: -3,
                    color: 'whitesmoke',
                }}
            >
                {entityIcon(properties.entityName)}
            </Badge>
        </Tooltip>
    );
}

export function RenderSimpleKeyValue(properties: {
    title: string;
    value: string;
    children: ReactNode;
}): ReactNode {
    return (
        <Card type="inner" hoverable>
            <Tooltip title={properties.value}>
                <Space>
                    <Text type="secondary">{properties.title}:</Text>
                    {properties.children}
                </Space>
            </Tooltip>
        </Card>
    );
}

export function RenderSystemType(properties: {
    systemName: string;
}): ReactNode {
    const target = properties.systemName.toLowerCase();

    if (target.startsWith('win'))
        return <Avatar src={'/windows.png'} size="small" shape="circle" />;
    else if (target.startsWith('mac'))
        return <Avatar src={'/mac.png'} size="small" shape="circle" />;
    return <>{target.toLocaleUpperCase()}</>;
}

export function RenderInfo(properties: {
    itemKey: string;
    color: string;
    value: ReactNode;
}): ReactNode {
    return (
        <Card
            type="inner"
            key={properties.itemKey}
            className={GraphCardCss.card}
            styles={{
                body: {
                    padding: '6px',
                    paddingTop: '12px',
                    userSelect: 'none',
                    borderRadius: '10px',
                    paddingBottom: '12px',
                },
            }}
        >
            <Space style={{ columnGap: '5px' }}>
                <Tag color={properties.color} bordered>
                    {properties.itemKey}
                </Tag>
                {properties.value}
            </Space>
        </Card>
    );
}

export function RenderTestItem(properties: {
    record: ParsedTestRecord | ParsedSuiteRecord;
    layoutStyle?: CSSProperties;
}): ReactNode {
    return (
        <Space align="center" style={properties.layoutStyle ?? {}}>
            <RenderStatus value={properties.record.Status} />
            <Text
                ellipsis={{ tooltip: true }}
                style={{
                    minWidth: 160,
                    textWrap: 'balance',
                }}
                type={testStatusText(properties.record.Status)}
            >
                {properties.record.Title}
            </Text>
            {properties.record.type === 'SUITE' ||
            // @ts-expect-error we do not have isBroken for test
            !properties.record?.isBroken ? (
                <></>
            ) : (
                <Tooltip title="No Assertion under it has failed">
                    <Badge
                        color="yellow"
                        count="BROKEN"
                        title=""
                        style={{
                            color: 'black',
                            fontWeight: 'bold',
                        }}
                    />
                </Tooltip>
            )}
        </Space>
    );
}
