import type TestRunRecord from 'src/types/test-run-records';
import {
    getOverAllAggResultsURL,
    getRelatedRuns,
    getSessionSummaryURL,
    getTestRun,
    getTestRunConfig,
} from 'src/components/scripts/helper';
import type {
    AttachmentContent,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import type { statusOfEntity } from 'src/types/session-records';
import Counter, { StatisticNumber } from 'src/components/utils/counter';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import ProgressPieChart from 'src/components/charts/status-pie-chart';
import {
    RenderEntityType,
    RenderDuration,
    RenderStatus,
    RenderSystemType,
} from 'src/components/utils/renderers';
import RenderPassedRate from 'src/components/charts/stacked-bar-chart';
import GalleryOfImages, {
    PlainImage,
} from 'src/components/utils/images-with-thumbnails';

import React, { useState, type ReactNode, useContext } from 'react';
import dayjs from 'dayjs';

import Space from 'antd/lib/space';
import Card from 'antd/lib/card/Card';
import Typography from 'antd/lib/typography/Typography';
import Table from 'antd/lib/table/Table';
import Select from 'antd/lib/select/index';
import MetaCallContext from './context';
import Tabs from 'antd/lib/tabs/index';
import useSWR from 'swr';
import Description, {
    type DescriptionsProps,
} from 'antd/lib/descriptions/index';
import type {
    AttachmentValueForConfig,
    TestRunConfig,
} from 'src/types/test-run-records';
import type { OverallAggResults } from 'src/components/scripts/RunPage/overview';
import { type SessionSummary } from 'src/components/scripts/RunPage/overview';
import type { SuiteDetails } from 'src/types/generated-response';
import { convertForWrittenAttachments } from 'src/components/parse-utils';
import { Affix } from 'antd/lib';
import Tag from 'antd/lib/tag/index';
import GraphCardCss from '../../../styles/GraphCard.module.css';
import { standingToColors } from 'src/components/charts/constants';
import Progress from 'antd/lib/progress/index';
import Dotted from 'src/styles/dotted.module.css';

function TopSuites(properties: {
    suites: SuiteDetails[];
    isTest: boolean;
}): ReactNode {
    const data = properties.suites;
    const top5Suites = data.map((suite) => ({
        key: suite.suiteID,
        ...suite,
    }));

    return (
        <Table
            dataSource={top5Suites}
            size="small"
            bordered
            pagination={false}
            style={{
                flexShrink: 1,
                maxWidth: '655px',
            }}
            scroll={{ y: 181, x: 'max-content' }}
        >
            {properties.isTest ? (
                <Table.Column
                    title="Status"
                    width={60}
                    align="center"
                    dataIndex="standing"
                    render={(value: statusOfEntity) => (
                        <RenderStatus value={value} />
                    )}
                    fixed="left"
                />
            ) : (
                <></>
            )}
            <Table.Column title="Name" dataIndex="title" width={150} />
            {properties.isTest ? (
                <></>
            ) : (
                <Table.Column
                    title="Rate"
                    dataIndex="Passed"
                    width={100}
                    render={(_: number, record: SuiteRecordDetails) => (
                        <RenderPassedRate
                            value={[
                                record.passed,
                                record.failed,
                                record.skipped,
                            ]}
                            immutable={true}
                        />
                    )}
                />
            )}
            <Table.Column
                dataIndex="started"
                title="Range"
                width={180}
                render={(value: string, record: SuiteRecordDetails) => (
                    <RelativeTo
                        dateTime={dayjs(value)}
                        style={{
                            marginLeft: '30px',
                            maxWidth: '220px',
                        }}
                        secondDateTime={dayjs(record.ended)}
                        autoPlay={false}
                    />
                )}
                responsive={['lg']}
            />
        </Table>
    );
}

function PreviewForImages(): ReactNode {
    const { port, testID, attachmentPrefix } = useContext(MetaCallContext);
    const { data: aggResults } = useSWR<OverallAggResults>(
        getOverAllAggResultsURL(port, testID),
    );
    if (testID == undefined || aggResults == undefined) return <></>;
    const allImages: AttachmentContent[] = aggResults.randomImages.map(
        (image) => JSON.parse(image),
    );
    const images = allImages.sort(() => 0.5 - Math.random()).slice(0, 6);

    return images.length > 0 ? (
        <GalleryOfImages loop={true} maxWidth={'350px'}>
            {images.map((image, index) => (
                <PlainImage
                    url={convertForWrittenAttachments(
                        attachmentPrefix ?? '',
                        testID,
                        image.value,
                    )}
                    key={index}
                    title={image.title}
                    maxHeight={'250px'}
                    isPlain={true}
                />
            ))}
        </GalleryOfImages>
    ) : (
        <></>
    );
}

function DescriptiveValues(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: aggResults } = useSWR<OverallAggResults>(
        getOverAllAggResultsURL(port, testID),
    );

    const { data: sessions } = useSWR<SessionSummary[]>(
        getSessionSummaryURL(port, testID),
    );
    const { data: runConfig } = useSWR<TestRunConfig[]>(
        getTestRunConfig(port, testID),
    );

    if (
        testID == undefined ||
        aggResults == undefined ||
        sessions == undefined ||
        runConfig == undefined
    )
        return <></>;

    const browsersUsed: Record<string, number> = {};
    for (const sessionObject of sessions) {
        if (browsersUsed[sessionObject.entityName])
            browsersUsed[sessionObject.entityName] += sessionObject.tests;
        else browsersUsed[sessionObject.entityName] = sessionObject.tests;
    }

    const testRunConfig = runConfig
        .filter((config) => config.type === 'CONFIG')
        .at(0);

    const configValue = JSON.parse(
        testRunConfig?.attachmentValue ?? '',
    ) as AttachmentValueForConfig;

    const extras: DescriptionsProps['items'] = [
        {
            key: 'suites',
            label: 'Parent Suites',
            children: <StatisticNumber end={aggResults.parentSuites} />,
        },
        {
            key: 'files',
            label: 'Spec Files',
            children: <StatisticNumber end={aggResults.fileCount} />,
        },
        {
            key: 'sessions',
            label: 'Sessions',
            children: <StatisticNumber end={aggResults.sessionCount} />,
        },
        {
            key: 'attachments',
            label: 'Attachments',
            children: <StatisticNumber end={aggResults.imageCount} />,
        },
        {
            children: (
                <RenderSystemType systemName={configValue.platformName} />
            ),
            key: 'system',
            label: 'System',
        },
        {
            key: 'browsers',
            label: 'Browsers',
            children: (
                <>
                    {Object.keys(browsersUsed).map((browser) => (
                        <StatisticNumber
                            key={browser}
                            title={<RenderEntityType entityName={browser} />}
                            end={browsersUsed[browser]}
                        />
                    ))}
                </>
            ),
        },
    ];

    return (
        <Description
            style={{ marginTop: '12px' }}
            items={extras}
            bordered
            size="small"
        />
    );
}

function Summary(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const { data: aggResults } = useSWR<OverallAggResults>(
        getOverAllAggResultsURL(port, testID),
    );

    const [isTest, setTest] = useState<boolean>(true);

    if (run == undefined || aggResults == undefined) return;

    const startedAt = dayjs(run.started);

    const suiteSummary = JSON.parse(run.suiteSummary);

    const total = isTest ? run.tests : suiteSummary.count;
    const passed = isTest ? run.passed : suiteSummary.passed;
    const failed = isTest ? run.failed : suiteSummary.failed;
    const skipped = isTest ? run.skipped : suiteSummary.skipped;

    return (
        <Card className={Dotted.dotted}>
            <Space
                align="start"
                style={{ width: '100%', justifyContent: 'stretch' }}
            >
                <Space direction="vertical">
                    <div style={{ width: '350px' }}>
                        <Affix
                            offsetBottom={150}
                            style={{
                                position: 'relative',
                                top: '86px',
                                left: '124px',
                                width: '0px',
                                height: '0px',
                            }}
                        >
                            <Select
                                key={'switch'}
                                bordered={false}
                                style={{ zIndex: 2 }}
                                options={[
                                    {
                                        value: true,
                                        label: `Test Cases`,
                                    },
                                    {
                                        value: false,
                                        label: `Test Suites`,
                                    },
                                ]}
                                value={isTest}
                                onChange={(checked) => {
                                    setTest(checked);
                                }}
                            />
                        </Affix>
                        <ProgressPieChart run={run} isTestCases={isTest} />
                    </div>
                    <PreviewForImages />
                </Space>
                <Space
                    style={{
                        flexDirection: 'column',
                        rowGap: '12px',
                        flexGrow: 1,
                    }}
                    styles={{
                        item: { width: '100%' },
                    }}
                >
                    <Space
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                        align="center"
                    >
                        <Counter
                            end={total}
                            style={{
                                fontSize: '2.5rem',
                                textShadow: 'rgba(0,208,255,0.9) 0px 0px 10px',
                                whiteSpace: 'nowrap',
                            }}
                            maxDigits={run.tests}
                            suffix={isTest ? ' Tests' : ' Suites'}
                        />
                        <Space
                            align="baseline"
                            style={{
                                width: '100%',
                                flexGrow: 2,
                            }}
                            size={20}
                        >
                            <Progress
                                percent={Number(
                                    ((passed / total) * 1e2).toFixed(2),
                                )}
                                type="dashboard"
                                strokeColor={'green'}
                                gapDegree={40}
                                size={85}
                            />
                            <Progress
                                percent={Number(
                                    ((failed / total) * 1e2).toFixed(2),
                                )}
                                type="dashboard"
                                strokeColor={'red'}
                                gapDegree={40}
                                size={85}
                            />
                            <Progress
                                percent={Number(
                                    ((skipped / total) * 1e2).toFixed(2),
                                )}
                                type="dashboard"
                                strokeColor={'yellow'}
                                gapDegree={40}
                                size={85}
                            />
                        </Space>
                    </Space>
                    <Space style={{ flexWrap: 'wrap', gap: '10px' }}>
                        {[
                            {
                                key: 'Status',
                                value: (
                                    <Space>
                                        <RenderStatus value={run.standing} />
                                        <Typography
                                            style={{
                                                color: standingToColors[
                                                    run.standing
                                                ],
                                            }}
                                        >
                                            {run.standing
                                                .charAt(0)
                                                .toUpperCase() +
                                                run.standing
                                                    .slice(1)
                                                    .toLowerCase()}
                                        </Typography>
                                    </Space>
                                ),
                                color: standingToColors[run.standing],
                            },
                            {
                                key: 'Duration',
                                value: (
                                    <RenderDuration
                                        value={dayjs.duration(run.duration)}
                                        autoPlay={true}
                                    />
                                ),
                                color: 'blue',
                            },
                            {
                                key: 'Range',
                                value: (
                                    <RelativeTo
                                        dateTime={startedAt}
                                        style={{
                                            marginLeft: '30px',
                                            maxWidth: '180px',
                                        }}
                                        secondDateTime={dayjs(run.ended)}
                                        autoPlay={true}
                                    />
                                ),
                                color: 'purple',
                            },
                        ].map((item) => (
                            <Card
                                type="inner"
                                key={item.key}
                                className={GraphCardCss.card}
                                bodyStyle={{
                                    padding: '6px',
                                    paddingTop: '12px',
                                    paddingBottom: '12px',
                                }}
                            >
                                <Space style={{ columnGap: '5px' }}>
                                    <Tag color={item.color} bordered>
                                        {item.key}
                                    </Tag>
                                    {item.value}
                                </Space>
                            </Card>
                        ))}
                    </Space>
                    <Tabs
                        items={[
                            {
                                key: 'recent',
                                label: 'Recent',
                                children: (
                                    <TopSuites
                                        suites={
                                            isTest
                                                ? aggResults.recentTests
                                                : aggResults.recentSuites
                                        }
                                        isTest={isTest}
                                    />
                                ),
                            },
                        ]}
                    />
                </Space>
            </Space>
        </Card>
    );
}

export default function Overview(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: aggResults } = useSWR<OverallAggResults>(
        getOverAllAggResultsURL(port, testID),
    );
    const { data: relatedRuns } = useSWR<TestRunRecord[]>(
        getRelatedRuns(port, testID),
    );

    if (relatedRuns == undefined || aggResults == undefined) return <></>;

    return <Summary />;
}
