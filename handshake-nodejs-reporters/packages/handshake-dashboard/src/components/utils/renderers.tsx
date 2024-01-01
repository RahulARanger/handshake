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
                >
                    ✅
                </Text>
            );
        }
        case 'FAILED': {
            return (
                <Text className={`${Dotted.redGlowText} ${Dotted.spin}`}>
                    ❌
                </Text>
            );
        }
        case 'SKIPPED': {
            return (
                <Text
                    className={Dotted.yellowGlowText}
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
                    className="warn-glow"
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
                    className="retried-glow"
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
                color="lime"
                size="small"
                overflowCount={200}
                style={{ top: -3, right: -3 }}
            >
                {entityIcon(properties.entityName)}
            </Badge>
        </Tooltip>
    );
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
            bodyStyle={{
                padding: '6px',
                paddingTop: '12px',
                paddingBottom: '12px',
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
