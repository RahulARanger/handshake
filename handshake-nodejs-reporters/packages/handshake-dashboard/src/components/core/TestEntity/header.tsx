import React, { useContext } from 'react';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import CaretLeftOutlined from '@ant-design/icons/CaretLeftOutlined';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import RenderTestType from 'src/components/utils/test-status-dot';
import Text from 'antd/lib/typography/Text';
import { Badge, Divider, Tooltip } from 'antd/lib';
import { childBadge, parentBadge, retriedBadge } from './constants';
import { StaticPercent } from 'src/components/utils/counter';
import { RenderEntityType } from 'src/components/utils/renderers';
import { DetailedContext } from 'src/types/records-in-detailed';
import type { ParsedSuiteRecord } from 'src/types/parsed-records';

export function NavigationButtons(properties: {
    selectedSuite: ParsedSuiteRecord;
    setTestID: (testID: string) => void;
}) {
    const context = useContext(DetailedContext);
    if (!context) return <></>;

    const { retriedRecords } = context;
    const records = retriedRecords ?? {};
    const record = records[properties.selectedSuite.Id] ?? {
        tests: [],
        length: 0,
    };

    const previousSuite = record.tests.at(record.key - 1);
    const nextSuite = record.tests.at(record.key + 1);

    const hasPreviousRetry = previousSuite != undefined && record.key > 0;
    const hasNextRetry = nextSuite != undefined;
    const hasParent =
        properties.selectedSuite.Parent != undefined &&
        properties.selectedSuite.Parent != '';

    return (
        <Space>
            <Tooltip title="Previous Retry">
                <Button
                    size="small"
                    icon={<CaretLeftOutlined />}
                    disabled={!hasPreviousRetry}
                    title={hasPreviousRetry ? 'Prev Retry' : 'No Retries Found'}
                    onClick={() =>
                        properties.setTestID(previousSuite as string)
                    }
                />
            </Tooltip>
            {hasParent ? (
                <Button
                    type="dashed"
                    size="small"
                    onClick={() =>
                        properties.setTestID(properties.selectedSuite.Parent)
                    }
                >
                    Parent Suite
                </Button>
            ) : (
                <></>
            )}
            <Tooltip title="Next Retry">
                <Button
                    size="small"
                    disabled={!hasNextRetry}
                    icon={<CaretRightOutlined />}
                    title={hasNextRetry ? 'Next Retry' : 'No Entities found'}
                    onClick={() => properties.setTestID(nextSuite as string)}
                />
            </Tooltip>
        </Space>
    );
}

export function RightSideOfHeader(properties: {
    selected: ParsedSuiteRecord;
    setTestID: (_: string) => void;
    entityName: string;
    entityVersion: string;
    simplified: string;
    contributed: number;
}) {
    return (
        <Space split={<Divider type="vertical" />}>
            <StaticPercent percent={properties.contributed} />
            <RenderEntityType
                entityName={properties.entityName}
                simplified={properties.simplified}
                entityVersion={properties.entityVersion}
            />
            <NavigationButtons
                selectedSuite={properties.selected}
                setTestID={properties.setTestID}
            />
        </Space>
    );
}

export default function LeftSideOfHeader(properties: { selected?: string }) {
    const context = useContext(DetailedContext);
    if (!context) return <></>;
    const { suites } = context;

    const selected = suites[properties?.selected ?? ''];
    const wasRetried = selected?.Status === 'RETRIED';

    return (
        <Space align="baseline">
            {wasRetried ? (
                <Tooltip title={retriedBadge}>
                    <Badge
                        count={'REPLACED'}
                        style={{
                            fontWeight: 'bold',
                            color: 'white',
                        }}
                        color="red"
                        size="default"
                        title=""
                    />
                </Tooltip>
            ) : (
                <></>
            )}
            <Tooltip title={selected.Parent ? childBadge : parentBadge}>
                <Badge
                    count={selected.Parent ? 'CHILD' : 'PARENT'}
                    style={{
                        fontWeight: 'bold',
                        color: 'white',
                    }}
                    color={selected.Parent ? 'volcano' : 'geekblue'}
                    size="default"
                    title=""
                />
            </Tooltip>
            <RenderTestType value="SUITE" />

            <Text>
                {selected.Title}
                <sub>
                    <Text
                        italic
                        style={{
                            fontSize: '10px',
                            fontWeight: 'lighter',
                            marginLeft: '5px',
                        }}
                    >
                        {selected.File}
                    </Text>
                </sub>
            </Text>
        </Space>
    );
}
