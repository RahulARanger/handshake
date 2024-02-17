import type { CSSProperties } from 'react';
import React, { type ReactNode } from 'react';
import type { statusOfEntity } from '@/types/session-records';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import Dotted from '@/styles/dotted.module.css';
import Text from 'antd/lib/typography/Text';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Space from 'antd/lib/space';
import Card from 'antd/lib/card/Card';
import Tag from 'antd/lib/tag/index';
import type { possibleEntityNames } from '@/types/session-records';
import Avatar from 'antd/lib/avatar/avatar';
import GraphCardCss from '@/styles/GraphCard.module.css';
import { Badge, Tooltip } from 'antd/lib';
import Button from 'antd/lib/button/button';
import GithubOutlined from '@ant-design/icons/GithubOutlined';
import { showOnly, sourceUrl } from '@/types/ui-constants';
import type {
    ParsedSuiteRecord,
    ParsedTestRecord,
} from 'src/types/parsed-records';
import { testStatusText } from '@/core/TestEntity/extractors';
import { LOCATORS } from 'handshake-utils';
import type { possibleFrameworks } from 'src/types/test-run-records';
import { Group } from 'antd/lib/avatar';

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
    else if (target.startsWith('linux'))
        return <Avatar src={'/linux.png'} size="small" shape="circle" />;
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

export function GithubRepoLink() {
    return (
        <Button
            icon={<GithubOutlined style={{ fontSize: 20 }} />}
            href={sourceUrl}
            target="_blank"
            id={LOCATORS.RUNS.githubURL}
        />
    );
}

export function RenderFrameworkUsed(properties: {
    frameworks: possibleFrameworks[];
}) {
    const links: ReactNode[] = [];

    for (const framework of properties.frameworks) {
        switch (framework.trim().toLowerCase()) {
            case 'webdriverio': {
                links.push(
                    <Avatar
                        key="webdriverio"
                        size="small"
                        src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+TG9nbyBSZWd1bGFyPC90aXRsZT4KICAgIDxnIGlkPSJMb2dvLVJlZ3VsYXIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUiIGZpbGw9IiNFQTU5MDYiIHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjUiPjwvcmVjdD4KICAgICAgICA8cGF0aCBkPSJNOCwxNiBMOCw0OCBMNiw0OCBMNiwxNiBMOCwxNiBaIE00MywxNiBDNTEuODM2NTU2LDE2IDU5LDIzLjE2MzQ0NCA1OSwzMiBDNTksNDAuODM2NTU2IDUxLjgzNjU1Niw0OCA0Myw0OCBDMzQuMTYzNDQ0LDQ4IDI3LDQwLjgzNjU1NiAyNywzMiBDMjcsMjMuMTYzNDQ0IDM0LjE2MzQ0NCwxNiA0MywxNiBaIE0yNywxNiBMMTQuMTA2LDQ3Ljk5OTIwNzggTDExLjk5OSw0Ny45OTkyMDc4IEwyNC44OTQsMTYgTDI3LDE2IFogTTQzLDE4IEMzNS4yNjgwMTM1LDE4IDI5LDI0LjI2ODAxMzUgMjksMzIgQzI5LDM5LjczMTk4NjUgMzUuMjY4MDEzNSw0NiA0Myw0NiBDNTAuNzMxOTg2NSw0NiA1NywzOS43MzE5ODY1IDU3LDMyIEM1NywyNC4yNjgwMTM1IDUwLjczMTk4NjUsMTggNDMsMTggWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg=="
                    />,
                );
                break;
            }
            case 'mocha': {
                links.push(
                    <Avatar
                        key="mocha"
                        src="https://camo.githubusercontent.com/b997b9b1b7c78519ecd19dff214a8574d6f1312bbd6e85a202208bad20037bc5/68747470733a2f2f636c6475702e636f6d2f78465646784f696f41552e737667"
                        size="small"
                    />,
                );
                break;
            }
            case 'cucumber': {
                links.push(
                    <Avatar
                        key="cucumber"
                        src="https://user-images.githubusercontent.com/102477169/187096400-3b052fba-e2d7-45a7-b820-a09447a11d52.svg"
                        size="small"
                    />,
                );
                break;
            }
            case 'jasmine': {
                links.push(
                    <Avatar
                        key="jasmine"
                        src="https://avatars.githubusercontent.com/u/4624349?s=48&v=4"
                        size="small"
                    />,
                );
                break;
            }
        }
    }

    return links.length === 0 ? (
        <Text>{properties.frameworks}</Text>
    ) : (
        <Group>{links}</Group>
    );
}
