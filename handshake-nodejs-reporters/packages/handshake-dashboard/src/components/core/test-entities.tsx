import { menuTabs } from 'src/types/ui-constants';
import type { statusOfEntity } from 'src/types/session-records';
import type { possibleEntityNames } from 'src/types/session-records';
import { RenderEntityType, RenderStatus } from '../utils/renderers';
import RenderPassedRate from '../charts/stacked-bar-chart';
// import TestEntityDrawer from './TestEntity';
// import ProjectStructure from './TestRun/structure-tab';

import React, { useContext, type ReactNode, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import Table from 'antd/lib/table/Table';
import Button from 'antd/lib/button/button';
import Space from 'antd/lib/space/index';
import type { Duration } from 'dayjs/plugin/duration';
import Typography from 'antd/lib/typography/Typography';
import Text from 'antd/lib/typography/Text';
import { timeFormatUsed } from '../utils/Datetime/format';
import Badge from 'antd/lib/badge/index';
import { Spin } from 'antd/lib';
import { RenderDuration } from '../utils/relative-time';
import RelativeTo from '../utils/Datetime/relative-time';
import { StaticPercent } from '../utils/counter';
import { DetailedContext } from 'src/types/records-in-detailed';
import type { ParsedSuiteRecord, SuiteDetails } from 'src/types/parsed-records';
import ProjectStructure from './TestRun/structure-tab';
// import ProjectStructure from './TestRun/structure-tab';

export function TestRunStarted(): ReactNode {
    const context = useContext(DetailedContext);
    if (context == undefined)
        return <Text>There&apos;s no context over the current Test run</Text>;
    const { detailsOfTestRun } = context;
    return (
        <Typography>{`Test Run Started at: ${detailsOfTestRun.Started[0].format(
            timeFormatUsed,
        )}`}</Typography>
    );
}

function extractSuiteTree(
    suites: SuiteDetails,
    parent?: string,
): undefined | ParsedSuiteRecord[] {
    const result = suites['@order']
        .filter(
            (suiteID) =>
                suites[suiteID].Parent === (parent ?? '') &&
                suites[suiteID].Status !== 'RETRIED',
        )
        .map((suiteID) => ({
            children: extractSuiteTree(suites, suiteID),
            key: suiteID,
            ...suites[suiteID],
        }));
    return result.length > 0 ? result : undefined;
}

export default function TestEntities(properties: {
    defaultTab: string;
}): ReactNode {
    const context = useContext(DetailedContext);
    if (context == undefined) return <></>;

    const { suites } = context;

    // const [toShowTestID, setTestID] = useState<string>();
    // const [showEntity, setShowEntity] = useState<boolean>(false);

    // const onClose = (): void => {
    //     setShowEntity(false);
    // };

    // const helperToSetTestID = (testID: string): void => {
    //     setTestID(testID);
    //     setShowEntity(true);
    // };

    let selectedTab = <></>;

    switch (properties.defaultTab) {
        default: {
            return <Spin tip="Loading..." fullscreen size="large" />;
        }
        case menuTabs.testEntitiesTab.gridViewMode: {
            selectedTab = (
                <Table
                    dataSource={extractSuiteTree(suites)}
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
                    />
                    <Table.Column
                        title="Name"
                        dataIndex="Title"
                        width={200}
                        fixed="left"
                        filterSearch={true}
                        render={(value: string) => (
                            <Space>
                                <Button
                                    type="link"
                                    // onClick={() => (record.id)}
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
                        title="Progress"
                        dataIndex="RollupValues"
                        width={60}
                        sorter={(
                            a: ParsedSuiteRecord,
                            b: ParsedSuiteRecord,
                        ) => {
                            return a.RollupValues[0] - b.RollupValues[0];
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
                    />

                    <Table.Column
                        dataIndex="Contribution"
                        title="Contribution"
                        width={50}
                        align="center"
                        render={(_) => (
                            <StaticPercent
                                percent={Number(_.toFixed(2)) * 1e2}
                            />
                        )}
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
                            record: ParsedSuiteRecord,
                        ) => (
                            <Space>
                                <RenderEntityType
                                    entityName={value}
                                    entityVersion={record.entityVersion}
                                    simplified={record.simplified}
                                />
                            </Space>
                        )}
                    />
                    <Table.Column
                        dataIndex="File"
                        title="File"
                        width={100}
                        render={(value) =>
                            (value as string).replace(/^.*[/\\]/, '')
                        }
                    />
                </Table>
            );
            break;
        }
        case menuTabs.testEntitiesTab.treeViewMode: {
            selectedTab = <ProjectStructure />;
            break;
        }
    }

    return (
        <>
            {selectedTab}
            {/* <TestEntityDrawer
                open={showEntity}
                onClose={onClose}
                testID={toShowTestID}
                setTestID={helperToSetTestID}
            /> */}
        </>
    );
}
