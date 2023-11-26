import type TestRunRecord from 'src/types/testRunRecords';
import {
    getOverAllAggResultsURL,
    getRelatedRuns,
    getSessionSummaryURL,
    getTestRun,
    getTestRunConfig,
    runPage,
} from 'src/components/scripts/helper';
import type {
    AttachmentContent,
    SuiteRecordDetails,
} from 'src/types/testEntityRelated';
import type { statusOfEntity } from 'src/types/sessionRecords';
import {
    dateFormatUsed,
    timeFormatUsed,
} from 'src/components/utils/Datetime/format';
import Counter, { StatisticNumber } from 'src/components/utils/counter';
import RelativeTo from 'src/components/utils/Datetime/relativeTime';
import ProgressPieChart from 'src/components/charts/StatusPieChart';
import {
    RenderEntityType,
    RenderDuration,
    RenderStatus,
    RenderSystemType,
} from 'src/components/utils/renderers';
import RenderPassedRate from 'src/components/charts/StackedBarChart';
import GalleryOfImages, {
    CardForAImage,
} from 'src/components/utils/ImagesWithThumbnails';

import React, { useState, type ReactNode, useContext } from 'react';
import dayjs from 'dayjs';

import Space from 'antd/lib/space';
import Card from 'antd/lib/card/Card';
import Meta from 'antd/lib/card/Meta';
import Typography from 'antd/lib/typography/Typography';
import Switch from 'antd/lib/switch';
import Tooltip from 'antd/lib/tooltip/index';
import Divider from 'antd/lib/divider/index';
import Table from 'antd/lib/table/Table';
import type { TimelineProps } from 'antd/lib/timeline/Timeline';
import Timeline from 'antd/lib/timeline/Timeline';
import MetaCallContext from './context';
import useSWR from 'swr';
import Description, {
    type DescriptionsProps,
} from 'antd/lib/descriptions/index';
import type {
    AttachmentValueForConfig,
    TestRunConfig,
} from 'src/types/testRunRecords';
import type { OverallAggResults } from 'src/components/scripts/RunPage/overview';
import { type SessionSummary } from 'src/components/scripts/RunPage/overview';
import type { SuiteDetails } from 'src/types/generatedResponse';
import {
    convertForWrittenAttachments,
    timelineColor,
} from 'src/components/parseUtils';
import { Badge, Button, Popover } from 'antd/lib';

function TopSuites(props: { suites: SuiteDetails[] }): ReactNode {
    const data = props.suites;
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
                maxWidth: '800px',
                minWidth: '300px',
            }}
            scroll={{ y: 181, x: 'max-content' }}
            // footer={() => (
            //     <Space>
            //         <Typography>{`Showing ${top5Suites.length} Recent Suites, `}</Typography>
            //         <Typography>
            //             Click&nbsp;
            //             <Button
            //                 key="maria"
            //                 type="link"
            //                 style={{ padding: '0px' }}
            //                 onClick={() =>
            //                     document.getElementById('Detailed')?.click()
            //                 }
            //             >
            //                 here
            //             </Button>
            //             &nbsp;to know more details.
            //         </Typography>
            //     </Space>
            // )}
        >
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
            <Table.Column title="Name" dataIndex="title" width={220} />
            <Table.Column
                title="Rate"
                dataIndex="Passed"
                width={60}
                render={(_: number, record: SuiteRecordDetails) => (
                    <RenderPassedRate
                        value={[record.passed, record.failed, record.skipped]}
                        immutable={true}
                    />
                )}
            />
            <Table.Column
                title="Tests"
                align="center"
                dataIndex="tests"
                width={50}
            />
            <Table.Column
                dataIndex="started"
                title="Started"
                width={100}
                render={(value: string) => (
                    <Tooltip title={dayjs(value).format(dateFormatUsed)}>
                        {dayjs(value).format(timeFormatUsed)}
                    </Tooltip>
                )}
                responsive={['lg']}
            />
            <Table.Column
                title="Ended"
                width={100}
                dataIndex="ended"
                render={(value: string) => (
                    <Tooltip title={dayjs(value).format(dateFormatUsed)}>
                        {dayjs(value).format(timeFormatUsed)}
                    </Tooltip>
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
    if (testID == null || aggResults == null) return <></>;
    const allImages: AttachmentContent[] = aggResults.randomImages.map(
        (image) => JSON.parse(image),
    );
    const images = allImages.sort(() => 0.5 - Math.random()).slice(0, 6);

    return images.length > 0 ? (
        <GalleryOfImages loop={true} maxWidth={'500px'}>
            {images.map((image, index) => (
                <CardForAImage
                    url={convertForWrittenAttachments(
                        attachmentPrefix ?? '',
                        testID,
                        image.value,
                    )}
                    index={index}
                    key={index}
                    title={image.title}
                    maxHeight={'200px'}
                />
            ))}
        </GalleryOfImages>
    ) : (
        <></>
    );
}

function PieChart(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));

    const [isTest, setTest] = useState<boolean>(true);

    if (testID == null || run == null) return <></>;

    const startedAt = dayjs(run.started);
    const total = isTest ? run.tests : JSON.parse(run.suiteSummary).count;
    return (
        <Card
            bordered
            style={{ minHeight: '220px', maxWidth: '350px' }}
            title={
                <Space align="center">
                    <Typography>Executed</Typography>
                    <Counter end={total} maxDigits={run.tests} />
                    <Typography>
                        <Switch
                            key={'switch'}
                            defaultChecked
                            size="small"
                            checkedChildren={<>Test Cases</>}
                            unCheckedChildren={<>Test Suites</>}
                            onChange={(checked) => {
                                setTest(checked);
                            }}
                            checked={isTest}
                            style={{
                                marginBottom: '2px',
                                marginRight: '5px',
                            }}
                        />
                    </Typography>
                    <Typography>
                        {`On ${startedAt.format(dateFormatUsed)}`}
                    </Typography>
                </Space>
            }
            size="small"
            actions={[
                <Meta
                    key="started"
                    description={
                        <Tooltip title="Time Range | Duration">
                            <Space
                                split={
                                    <Divider
                                        type="vertical"
                                        style={{ margin: '0px' }}
                                    />
                                }
                                align="baseline"
                            >
                                <RelativeTo
                                    dateTime={startedAt}
                                    style={{
                                        marginLeft: '30px',
                                        maxWidth: '220px',
                                    }}
                                    secondDateTime={dayjs(run.ended)}
                                />
                                <RenderDuration
                                    value={dayjs.duration(run.duration)}
                                />
                            </Space>
                        </Tooltip>
                    }
                />,
            ]}
        >
            <ProgressPieChart run={run} isTestCases={isTest} />
        </Card>
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
        testID == null ||
        aggResults == null ||
        sessions == null ||
        runConfig == null
    )
        return <></>;

    const browsersUsed: Record<string, number> = {};
    sessions.forEach((sessionObj) => {
        if (browsersUsed[sessionObj.entityName])
            browsersUsed[sessionObj.entityName] += sessionObj.tests;
        else browsersUsed[sessionObj.entityName] = sessionObj.tests;
    });

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

function TimelineView(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: relatedRuns } = useSWR<TestRunRecord[]>(
        getRelatedRuns(port, testID),
    );
    if (relatedRuns == null) return <></>;

    const items: TimelineProps['items'] = relatedRuns.map((run) => ({
        children:
            testID === run.testID ? (
                <Badge size="small" color="orange" style={{ zoom: 1.5 }} dot>
                    <Button
                        type="text"
                        size="small"
                        style={{ marginLeft: '-10px', cursor: 'alias' }}
                    >
                        {dayjs(run.started).fromNow()}
                    </Button>
                </Badge>
            ) : (
                <Popover
                    content={
                        <Space direction="vertical" style={{ padding: '2px' }}>
                            <Space
                                align="baseline"
                                split={<Divider type="vertical" />}
                            >
                                <Typography>
                                    {dayjs(run.started).format(dateFormatUsed)}
                                </Typography>
                                <RenderDuration
                                    value={dayjs.duration(run.duration)}
                                    style={{
                                        maxWidth: '65px',
                                        minWidth: '65px',
                                    }}
                                />
                            </Space>
                            <RelativeTo
                                dateTime={dayjs(run.started)}
                                style={{
                                    maxWidth: '180px',
                                }}
                                secondDateTime={dayjs(run.ended)}
                            />
                        </Space>
                    }
                    title={
                        <Space>
                            <RenderPassedRate
                                value={[run.passed, run.failed, run.skipped]}
                            />
                        </Space>
                    }
                >
                    {run.testID !== testID ? (
                        <Button
                            type={'text'}
                            size="small"
                            style={{ marginLeft: '-10px' }}
                            href={runPage(run.testID)}
                            target="_blank"
                        >
                            {dayjs(run.started).fromNow()}
                        </Button>
                    ) : (
                        <></>
                    )}
                </Popover>
            ),
        key: run.testID,
        color: timelineColor(run.standing),
    }));

    return (
        <>
            <Typography style={{ position: 'relative', marginTop: '10px' }}>
                Related Runs:
            </Typography>
            <Timeline
                mode="left"
                items={items}
                style={{
                    maxHeight: '250px',
                    paddingRight: '6px',
                    paddingTop: '10px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            />
        </>
    );
}

export default function Overview(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: aggResults } = useSWR<OverallAggResults>(
        getOverAllAggResultsURL(port, testID),
    );

    if (aggResults == null) return <></>;

    return (
        <Space direction="vertical" style={{ rowGap: '10px', width: '99%' }}>
            <Space
                style={{
                    columnGap: '10px',
                    justifyContent: 'space-evenly',
                    width: '99%',
                }}
            >
                <PieChart />
                <TopSuites suites={aggResults.recentSuites} />
            </Space>
            <Space
                align="start"
                style={{
                    justifyContent: 'space-between',
                    width: '99%',
                }}
            >
                <PreviewForImages />
                <DescriptiveValues />
                <TimelineView />
            </Space>
        </Space>
    );
}
