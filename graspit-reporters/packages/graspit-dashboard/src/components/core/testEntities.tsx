import { gridViewMode, treeViewMode } from 'src/types/uiConstants';
import type { SessionDetails, SuiteDetails } from 'src/types/generatedResponse';
import type { statusOfEntity } from 'src/types/sessionRecords';
import { parseDetailedTestEntity } from '../parseUtils';
import {
    getSuites,
    getSessions,
    getTestRun,
} from 'src/components/scripts/helper';
import type { possibleEntityNames } from 'src/types/sessionRecords';
import type { PreviewForDetailedEntities } from 'src/types/parsedRecords';
import RenderTimeRelativeToStart, {
    RenderDuration,
    RenderEntityType,
    RenderStatus,
} from '../utils/renderers';
import MetaCallContext from './TestRun/context';
import RenderPassedRate from '../charts/StackedBarChart';
import TestEntityDrawer from './TestEntity';
import ProjectStructure from './TestRun/Structure';

import React, { useContext, type ReactNode, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import useSWR from 'swr';

import Table from 'antd/lib/table/Table';
import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import Button from 'antd/lib/button/button';
import TableOutlined from '@ant-design/icons/TableOutlined';
import PartitionOutlined from '@ant-design/icons/PartitionOutlined';
import Segmented, {
    type SegmentedLabeledOption,
} from 'antd/lib/segmented/index';
import Space from 'antd/lib/space/index';
import type { Duration } from 'dayjs/plugin/duration';
import Typography from 'antd/lib/typography/Typography';
import { timeFormatUsed } from '../utils/Datetime/format';
import type TestRunRecord from 'src/types/testRunRecords';

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
        .filter((suiteID) => parent === suites[suiteID].parent)
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
    if (data == null) return <></>;
    return (
        <Typography>{`Test Run Started at: ${dayjs(data.started).format(
            timeFormatUsed,
        )}`}</Typography>
    );
}

export default function TestEntities(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const [showEntity, setShowEntity] = useState<boolean>(false);
    const [toShowTestID, setTestID] = useState<string>();
    const [viewMode, setViewMode] = useState<number | string>(gridViewMode);

    const onClose = (): void => {
        setShowEntity(false);
    };

    if (run == null || suites == null || sessions == null) return <></>;

    const data = extractSuiteTree(suites, '', dayjs(run.started), sessions);

    const options: SegmentedLabeledOption[] = [
        {
            label: 'Grid',
            value: gridViewMode,
            icon: <TableOutlined />,
        },
        {
            label: 'Tree',
            value: treeViewMode,
            icon: <PartitionOutlined />,
        },
    ];

    const helperToSetTestID = (testID: string): void => {
        setTestID(testID);
        setShowEntity(true);
    };

    return (
        <>
            <Space
                direction="vertical"
                style={{ width: '99%', marginTop: '6px' }}
            >
                <Space
                    style={{
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                    }}
                >
                    <Segmented
                        options={options}
                        defaultValue={viewMode}
                        onChange={(value) => {
                            const selected = value.toString();
                            setViewMode(selected);
                        }}
                        style={{ marginBottom: '5px' }}
                    />
                    <TestRunStarted />
                </Space>
                {viewMode === gridViewMode ? (
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
                            width={220}
                            fixed="left"
                            filterSearch={true}
                            filters={Array.from(
                                new Set(data?.map((suite) => suite.Title)),
                            )?.map((suite) => ({
                                text: suite,
                                value: suite,
                            }))}
                            onFilter={(value, record: SuiteNode) =>
                                value === record.Title
                            }
                        />
                        <Table.Column
                            title="Rate"
                            dataIndex="Rate"
                            width={100}
                            sorter={(a: SuiteNode, b: SuiteNode) => {
                                return a.Rate[0] - b.Rate[0];
                            }}
                            render={(value: [number, number, number]) => (
                                <RenderPassedRate
                                    value={value}
                                    width={100}
                                    immutable={true}
                                />
                            )}
                        />
                        <Table.Column
                            title="Tests"
                            align="center"
                            dataIndex="Tests"
                            width={25}
                            sorter={(a: SuiteNode, b: SuiteNode) => {
                                return a.Tests - b.Tests;
                            }}
                        />
                        <Table.Column
                            title="Retried"
                            align="center"
                            dataIndex="Retried"
                            width={25}
                            sorter={(a: SuiteNode, b: SuiteNode) => {
                                return a.Retried - b.Retried;
                            }}
                        />
                        <Table.Column
                            dataIndex="Started"
                            title="Started"
                            width={130}
                            render={(value: [Dayjs, Dayjs]) => (
                                <RenderTimeRelativeToStart value={value} />
                            )}
                            sorter={(a: SuiteNode, b: SuiteNode) => {
                                return Number(
                                    a.Started[0].isBefore(b.Started[0]),
                                );
                            }}
                        />
                        <Table.Column
                            title="Ended"
                            width={130}
                            dataIndex="Ended"
                            render={(value: [Dayjs, Dayjs]) => (
                                <RenderTimeRelativeToStart
                                    value={value}
                                    style={{ maxWidth: 'unset' }}
                                />
                            )}
                        />
                        <Table.Column
                            title="Duration"
                            width={60}
                            dataIndex="Duration"
                            render={(value: Duration) => (
                                <RenderDuration value={value} />
                            )}
                        />
                        <Table.Column
                            title="Entity"
                            width={25}
                            dataIndex="entityName"
                            align="center"
                            render={(value: possibleEntityNames) => (
                                <RenderEntityType entityName={value} />
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
                            width={30}
                            filterSearch={true}
                            filters={Array.from(
                                new Set(data?.map((suite) => suite.File)),
                            )?.map((suite) => ({
                                text: suite,
                                value: suite,
                            }))}
                            onFilter={(value, record: SuiteNode) =>
                                value === record.File
                            }
                        />
                        <Table.Column
                            dataIndex=""
                            title="Open"
                            width={50}
                            render={(_, record: SuiteNode) => (
                                <Button
                                    icon={<ExpandAltOutlined />}
                                    shape="circle"
                                    onClick={() => {
                                        setTestID(record.id);
                                        setShowEntity(true);
                                    }}
                                />
                            )}
                        />
                    </Table>
                ) : (
                    <ProjectStructure setTestID={helperToSetTestID} />
                )}
            </Space>
            <TestEntityDrawer
                open={showEntity}
                onClose={onClose}
                testID={toShowTestID}
                setTestID={helperToSetTestID}
            />
        </>
    );
}
