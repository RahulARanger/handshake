import type {
    SuiteDetails,
    SessionDetails,
} from 'src/types/generated-response';
import type { AttachmentDetails } from 'src/types/generated-response';
import type { TestDetails } from 'src/types/generated-response';
import {
    optionsForEntities,
    parseTestCaseEntity,
} from 'src/components/parse-utils';
import type TestRunRecord from 'src/types/test-run-records';
import {
    getEntityLevelAttachment,
    getSessions,
    getTestRun,
    getSuites,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import MetaCallContext from '../TestRun/context';
import type { Tag as SuiteTag } from 'src/types/test-entity-related';
import { imagesTab } from './entity-item';
import React, { useContext, type ReactNode, useState } from 'react';
import dayjs from 'dayjs';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import Empty from 'antd/lib/empty/index';
import useSWR from 'swr';
import Drawer from 'antd/lib/drawer/index';
import Badge from 'antd/lib/badge/index';
import LeftSideOfHeader, { RightSideOfHeader } from './header';
import Dotted from 'src/styles/dotted.module.css';
import RenderProgress from 'src/components/utils/progress-rate';
import Steps from 'antd/lib/steps/index';
import {
    attachedTabItems,
    extractDetailedTestEntities,
    extractRollupDependencies,
    filterTestAttachments,
    filterTestsAndSuites,
    stepItemsForSuiteTimeline,
} from './extractors';
import { Tabs } from 'antd/lib';
import TestEntitiesBars from 'src/components/charts/test-bars';
import Layout, { Header } from 'antd/lib/layout/layout';

export default function TestEntityDrawer(properties: {
    open: boolean;
    onClose: () => void;
    testID?: string;
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);

    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const { data: attachments } = useSWR<AttachmentDetails>(
        getEntityLevelAttachment(port, testID),
    );
    const { data: writtenAttachments } = useSWR<AttachmentDetails>(
        getWrittenAttachments(port, testID),
    );

    const [choices, setChoices] = useState<string[]>([]);
    const [tabForDetailed, setTabForDetailed] = useState<string>(imagesTab);
    if (
        properties.testID == undefined ||
        sessions == undefined ||
        run == undefined ||
        suites == undefined ||
        tests == undefined ||
        attachments == undefined ||
        writtenAttachments == undefined
    )
        return <></>;

    const selectedSuiteDetails = suites[properties.testID];
    const started = dayjs(run.started);

    const closeTimeline = () =>
        setChoices(choices.filter((x) => x != optionsForEntities[0]));
    const setTestID = (detailed: string) => {
        properties.setTestID(detailed);
    };

    const rawSource = filterTestsAndSuites(
        selectedSuiteDetails.suiteID,
        suites,
        tests,
    );

    const testAttachments = filterTestAttachments(
        tests,
        suites,
        attachments,
        selectedSuiteDetails.suiteID,
    );

    const dataSource =
        extractDetailedTestEntities(
            rawSource,
            started,
            setTestID,
            testAttachments,
        ) ?? [];

    const tags = JSON.parse(selectedSuiteDetails.tags).map((tag: SuiteTag) => {
        return (
            <Badge
                key={tag.astNodeId}
                color="geekblue"
                count={tag.name}
                style={{ color: 'white' }}
            />
        );
    });

    const contributed =
        ((selectedSuiteDetails.rollup_tests ?? selectedSuiteDetails.tests) /
            Object.keys(tests).length) *
        100;

    // const savedAttachments = Object.values(writtenAttachments)
    //     .flat()
    //     .filter(
    //         (attached) =>
    //             tests[attached.entity_id]?.parent ===
    //             selectedSuiteDetails.suiteID,
    //     );

    const [assertionsUsed] = extractRollupDependencies(
        selectedSuiteDetails.suiteID,
        tests,
        attachments,
    );

    const currentSession = sessions[selectedSuiteDetails.session_id];

    return (
        <>
            <Drawer
                open={properties.open}
                onClose={() => {
                    properties.onClose();
                    closeTimeline();
                }}
                footer={
                    tags.length > 0 ? (
                        <Space>
                            <>Tags:</>
                            {tags}
                        </Space>
                    ) : undefined
                }
                title={
                    <Space style={{ marginBottom: '-5px' }} align="start">
                        <LeftSideOfHeader selected={properties.testID} />
                    </Space>
                }
                size="large"
                closeIcon={<CloseOutlined style={{ marginTop: '5px' }} />}
                width={'100%'}
                extra={
                    <RightSideOfHeader
                        selected={selectedSuiteDetails}
                        setTestID={setTestID}
                        contributed={contributed}
                        entityName={currentSession.entityName}
                        entityVersion={currentSession.entityVersion}
                        simplified={currentSession.simplified}
                    />
                }
                styles={{
                    body: { padding: '15px', paddingTop: '10px' },
                }}
                classNames={{ body: Dotted.dotted }}
                className={`${Dotted.dotted} ${Dotted.drawer}`}
                style={{
                    opacity: 0.96,
                    margin: 0,
                }}
            >
                <Layout
                    style={{
                        flexGrow: 1,
                        height: '100%',
                        padding: '0px',
                        lineHeight: 0,
                        backgroundColor: 'transparent',
                    }}
                >
                    <Header
                        style={{
                            height: '120px',
                            padding: 0,
                            margin: 0,
                            lineHeight: 0,
                            backgroundColor: 'transparent',
                        }}
                    >
                        <Space
                            direction="horizontal"
                            align="center"
                            style={{ width: '100%' }}
                            size={50}
                        >
                            <RenderProgress
                                passed={selectedSuiteDetails.passed}
                                failed={selectedSuiteDetails.failed}
                                skipped={selectedSuiteDetails.skipped}
                            />
                            <Space direction="vertical">
                                <Steps
                                    items={stepItemsForSuiteTimeline(
                                        selectedSuiteDetails.suiteID,
                                        suites,
                                        started,
                                        dayjs(run.ended),
                                        properties.setTestID,
                                    )}
                                    size="small"
                                    style={{
                                        flexGrow: 2,
                                        width: '100%',
                                    }}
                                />
                                <TestEntitiesBars entities={rawSource} />
                            </Space>
                        </Space>
                    </Header>
                    <Layout
                        style={{
                            lineHeight: 0,
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            backgroundColor: 'transparent',
                            flexDirection: 'row',
                        }}
                    >
                        {dataSource.length > 0 ? (
                            <Collapse
                                defaultActiveKey={['Latest Run']}
                                bordered
                                size="small"
                                items={dataSource}
                                style={{
                                    justifyContent: 'stretch',
                                    overflowY: 'scroll',
                                    flexGrow: 0.5,
                                    maxWidth: '60%',
                                }}
                            />
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No Test Entities were found"
                                style={{
                                    alignSelf: 'center',
                                    overflowY: 'auto',
                                }}
                            />
                        )}
                        <Tabs
                            style={{
                                flexGrow: 0.5,
                                overflowY: 'scroll',
                            }}
                            items={attachedTabItems(assertionsUsed)}
                            tabPosition="top"
                            tabBarStyle={{
                                zIndex: 3,
                                marginLeft: '9px',
                            }}
                            size="small"
                            animated
                        />
                    </Layout>
                </Layout>
            </Drawer>
        </>
    );
}
