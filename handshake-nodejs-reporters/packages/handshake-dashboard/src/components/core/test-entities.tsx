import { menuTabs } from 'src/types/ui-constants';
import type {
    SessionDetails,
    SuiteDetails,
} from 'src/types/generated-response';
import type { statusOfEntity } from 'src/types/session-records';
import { parseDetailedTestEntity } from '../parse-utils';
import {
    getSuites,
    getSessions,
    getTestRun,
} from 'src/components/scripts/helper';
import type { possibleEntityNames } from 'src/types/session-records';
import type { PreviewForDetailedEntities } from 'src/types/parsed-records';
import { RenderEntityType, RenderStatus } from '../utils/renderers';
import MetaCallContext from './TestRun/context';
import RenderPassedRate from '../charts/stacked-bar-chart';
import TestEntityDrawer from './TestEntity';
import ProjectStructure from './TestRun/structure-tab';

import React, { useContext, type ReactNode, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import useSWR from 'swr';
import Table from 'antd/lib/table/Table';
import Button from 'antd/lib/button/button';
import Space from 'antd/lib/space/index';
import type { Duration } from 'dayjs/plugin/duration';
import Typography from 'antd/lib/typography/Typography';
import Text from 'antd/lib/typography/Text';
import { timeFormatUsed } from '../utils/Datetime/format';
import type TestRunRecord from 'src/types/test-run-records';
import Badge from 'antd/lib/badge/index';
import { Spin } from 'antd/lib';
import { RenderDuration } from '../utils/relative-time';
import RelativeTo from '../utils/Datetime/relative-time';
import { StaticPercent } from '../utils/counter';

interface SuiteNode extends PreviewForDetailedEntities {
    children: undefined | SuiteNode[];
    key: string;
}

function extractSuiteTree(
    suites: SuiteDetails,
    parent: string,
    startDate: Dayjs,
    sessions: SessionDetails,
): undefined | SuiteNode[] {
    const result = suites['@order']
        .filter(
            (suiteID) =>
                parent === suites[suiteID].parent &&
                suites[suiteID].standing !== 'RETRIED',
        )
        .map((suiteID) => ({
            children: extractSuiteTree(suites, suiteID, startDate, sessions),
            key: suiteID,
            ...parseDetailedTestEntity(
                suites[suiteID],
                startDate,
                sessions[suites[suiteID].session_id],
            ),
        }));
    return result.length > 0 ? result : undefined;
}

export function TestRunStarted(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<TestRunRecord>(getTestRun(port, testID));
    if (data == undefined) return <></>;
    return (
        <Typography>{`Test Run Started at: ${dayjs(data.started).format(
            timeFormatUsed,
        )}`}</Typography>
    );
}

export default function TestEntities(properties: {
    defaultTab: string;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const [toShowTestID, setTestID] = useState<string>();

    const [showEntity, setShowEntity] = useState<boolean>(false);

    const onClose = (): void => {
        setShowEntity(false);
    };

    if (run == undefined || suites == undefined || sessions == undefined)
        return <></>;

    const data = extractSuiteTree(suites, '', dayjs(run.started), sessions);

    const helperToSetTestID = (testID: string): void => {
        setTestID(testID);
        setShowEntity(true);
    };

    let selectedTab = <></>;

    switch (properties.defaultTab) {
        default: {
            return <Spin tip="Loading..." fullscreen size="large" />;
        }
        case menuTabs.testEntitiesTab.gridViewMode: {
            selectedTab = (
                <Table
                    dataSource={data}
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                >
                    <Table.Column
                        title="Status"
                        width={40}
                        align="justify"
                        dataIndex="Status"
                        render={(value: statusOfEntity) => (
                            <RenderStatus value={value} />
                        )}
                        fixed="left"
                        filterMode="menu"
                        filterMultiple
                        filters={['PASSED', 'FAILED', 'SKIPPED'].map(
                            (status) => ({
                                text: (
                                    <Space>
                                        <RenderStatus value={status} />
                                        {`${status.at(0)}${status
                                            .slice(1)
                                            .toLowerCase()}`}
                                    </Space>
                                ),
                                value: status,
                            }),
                        )}
                        onFilter={(value, record: SuiteNode) =>
                            value === record.Status
                        }
                    />
                    <Table.Column
                        title="Name"
                        dataIndex="Title"
                        width={200}
                        fixed="left"
                        filterSearch={true}
                        filters={[
                            ...new Set(data?.map((suite) => suite.Title)),
                        ]?.map((suite) => ({
                            text: suite,
                            value: suite,
                        }))}
                        onFilter={(value, record: SuiteNode) =>
                            value === record.Title
                        }
                        render={(value: string, record: SuiteNode) => (
                            <Space>
                                <Button
                                    type="link"
                                    onClick={() => helperToSetTestID(record.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '2px',
                                        margin: '0px',
                                    }}
                                >
                                    <Text
                                        underline
                                        style={{
                                            color: 'rgba(255, 255, 255, 0.85)',
                                            whiteSpace: 'pretty',
                                            textAlign: 'left',
                                            textDecorationThickness: 0.5,
                                        }}
                                    >
                                        {value}
                                    </Text>
                                </Button>
                            </Space>
                        )}
                    />
                    <Table.Column
                        title="Tests"
                        dataIndex="Rate"
                        width={60}
                        sorter={(a: SuiteNode, b: SuiteNode) => {
                            return a.Rate[0] - b.Rate[0];
                        }}
                        render={(
                            value: [number, number, number],
                            record: SuiteNode,
                        ) => (
                            <Badge
                                count={record.Retried}
                                showZero={false}
                                size="small"
                                status="error"
                                title="Retried"
                            >
                                <RenderPassedRate
                                    value={value}
                                    width={160}
                                    immutable={true}
                                />
                            </Badge>
                        )}
                    />

                    <Table.Column
                        dataIndex="Started"
                        title="Range"
                        width={165}
                        render={(value: [Dayjs, Dayjs], record: SuiteNode) => (
                            <RelativeTo
                                dateTime={value[0]}
                                secondDateTime={record.Ended[0]}
                                style={{
                                    maxWidth: '165px',
                                    textAlign: 'right',
                                }}
                            />
                        )}
                        sorter={(a: SuiteNode, b: SuiteNode) => {
                            return Number(a.Started[0].isBefore(b.Started[0]));
                        }}
                    />
                    <Table.Column
                        dataIndex="Rate"
                        title="Contribution"
                        width={50}
                        align="center"
                        render={(_, record: SuiteNode) => (
                            <StaticPercent
                                percent={
                                    Number(
                                        (
                                            (suites[record.id]?.rollup_tests ??
                                                0) / run.tests
                                        ).toFixed(2),
                                    ) * 1e2
                                }
                            />
                        )}
                        sorter={(a: SuiteNode, b: SuiteNode) => {
                            return Number(a.Started[0].isBefore(b.Started[0]));
                        }}
                    />
                    <Table.Column
                        title="Duration"
                        width={100}
                        dataIndex="Duration"
                        render={(value: Duration) => (
                            <RenderDuration value={value} maxWidth="120px" />
                        )}
                    />
                    <Table.Column
                        title="Entity"
                        width={25}
                        dataIndex="entityName"
                        align="center"
                        render={(
                            value: possibleEntityNames,
                            // record: SuiteNode,
                        ) => (
                            <Space>
                                <RenderEntityType entityName={value} />
                            </Space>
                        )}
                        filterMode="menu"
                        filterMultiple
                        filters={['chrome'].map((status) => ({
                            text: (
                                <Space>
                                    <RenderEntityType entityName={status} />
                                    {`${status.at(0)}${status
                                        .slice(1)
                                        .toLowerCase()}`}
                                </Space>
                            ),
                            value: status,
                        }))}
                        onFilter={(value, record: SuiteNode) =>
                            record.entityName.toLowerCase() == value
                        }
                    />
                    <Table.Column
                        dataIndex="File"
                        title="File"
                        width={100}
                        filterSearch={true}
                        filters={[
                            ...new Set(data?.map((suite) => suite.File)),
                        ]?.map((suite) => ({
                            text: suite,
                            value: suite,
                        }))}
                        onFilter={(value, record: SuiteNode) =>
                            value === record.File
                        }
                        render={(value) =>
                            (value as string).replace(/^.*[/\\]/, '')
                        }
                    />
                </Table>
            );
            break;
        }
        case menuTabs.testEntitiesTab.treeViewMode: {
            selectedTab = <ProjectStructure setTestID={helperToSetTestID} />;
            break;
        }
    }

    return (
        <>
            {selectedTab}
            <TestEntityDrawer
                open={showEntity}
                onClose={onClose}
                testID={toShowTestID}
                setTestID={helperToSetTestID}
            />
        </>
    );
}
