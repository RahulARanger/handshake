import type { RetriedRecords } from 'src/types/generated-response';
import type { SuiteRecordDetails } from 'src/types/test-entity-related';
import { getRetriedRecords } from 'src/components/scripts/helper';
import MetaCallContext from '../TestRun/context';
import React, { useContext } from 'react';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import CaretLeftOutlined from '@ant-design/icons/CaretLeftOutlined';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import useSWR from 'swr';
import type { SuiteDetails } from 'src/types/generated-response';
import { getSuites } from 'src/components/scripts/helper';
import RenderTestType from 'src/components/utils/test-status-dot';
import Text from 'antd/lib/typography/Text';
import { Badge, Divider, Tooltip } from 'antd/lib';
import { childBadge, parentBadge, retriedBadge } from './constants';
import { StaticPercent } from 'src/components/utils/counter';
import { RenderEntityType } from 'src/components/utils/renderers';

export function NavigationButtons(properties: {
    selectedSuite: SuiteRecordDetails;
    setTestID: (testID: string) => void;
}) {
    const { port, testID } = useContext(MetaCallContext);
    const { data: retriedRecords } = useSWR<RetriedRecords>(
        getRetriedRecords(port, testID),
    );

    const records = retriedRecords ?? {};
    const record = records[properties.selectedSuite.suiteID] ?? {
        tests: [],
        length: 0,
    };

    const index =
        record?.tests?.indexOf(properties.selectedSuite.suiteID) ?? -1;

    const previousSuite = record.tests.at(index - 1);
    const nextSuite = record.tests.at(index + 1);

    const hasPreviousRetry = previousSuite != undefined && index > 0;
    const hasNextRetry = nextSuite != undefined;
    const hasParent =
        properties.selectedSuite?.parent != undefined &&
        properties.selectedSuite?.parent != '';

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
                        properties.setTestID(properties.selectedSuite.parent)
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
    selected: SuiteRecordDetails;
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
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));

    if (suites == undefined) return <></>;
    const selected = suites[properties?.selected ?? ''];

    const wasRetried = selected?.standing === 'RETRIED';

    return (
        <Space align="baseline">
            <RenderTestType value="SUITE" />
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
            <Tooltip title={selected.parent ? childBadge : parentBadge}>
                <Badge
                    count={selected.parent ? 'CHILD' : 'PARENT'}
                    style={{
                        fontWeight: 'bold',
                        color: 'white',
                    }}
                    color={selected.parent ? 'volcano' : 'geekblue'}
                    size="default"
                    title=""
                />
            </Tooltip>
            <Text>
                {selected.title}
                <sub>
                    <Text
                        italic
                        style={{
                            fontSize: '10px',
                            fontWeight: 'lighter',
                            marginLeft: '5px',
                        }}
                    >
                        {selected.file}
                    </Text>
                </sub>
            </Text>
        </Space>
    );
}
