import type TestRunRecord from 'src/types/testRunRecords';
import {
    getOverAllAggResultsURL,
    getRecentSuitesURL,
    getSessionSummaryURL,
    getTestRun,
    getTestRunConfig,
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
import MetaCallContext from './context';
import Button from 'antd/lib/button/button';
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

function TopSuites(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<SuiteRecordDetails[]>(
        getRecentSuitesURL(port, testID),
    );

    if (data == null) return <></>;

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
            style={{ flexShrink: 1, marginRight: '40px' }}
            scroll={{ y: 199, x: 'max-content' }}
            footer={() => (
                <Space>
                    <Typography>{`Showing ${top5Suites.length} Recent Suites, `}</Typography>
                    <Typography>
                        Click&nbsp;
                        <Button
                            key="maria"
                            type="link"
                            style={{ padding: '0px' }}
                        >
                            here
                        </Button>
                        &nbsp;to know more
                    </Typography>
                </Space>
            )}
        >
            <Table.Column
                title="Status"
                width={50}
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
                width={100}
                render={(_: number, record: SuiteRecordDetails) => (
                    <div style={{ width: '100%' }}>
                        <RenderPassedRate
                            value={[
                                record.passed,
                                record.failed,
                                record.skipped,
                            ]}
                            width={100}
                            immutable={true}
                        />
                    </div>
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
                width={60}
                render={(value: string) => (
                    <Tooltip title={dayjs(value).format(dateFormatUsed)}>
                        {dayjs(value).format(timeFormatUsed)}
                    </Tooltip>
                )}
            />
            <Table.Column
                title="Ended"
                width={60}
                dataIndex="ended"
                render={(value: string) => (
                    <Tooltip title={dayjs(value).format(dateFormatUsed)}>
                        {dayjs(value).format(timeFormatUsed)}
                    </Tooltip>
                )}
            />
        </Table>
    );
}

export default function Overview(): ReactNode {
    const { port, testID, attachmentPrefix } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const { data: aggResults } = useSWR<OverallAggResults>(
        getOverAllAggResultsURL(port, testID),
    );

    const { data: sessions } = useSWR<SessionSummary[]>(
        getSessionSummaryURL(port, testID),
    );
    const { data: runConfig } = useSWR<TestRunConfig[]>(
        getTestRunConfig(port, testID),
    );

    const [isTest, setTest] = useState<boolean>(true);

    if (
        aggResults == null ||
        sessions == null ||
        run == null ||
        runConfig == null
    )
        return <></>;

    const allImages: AttachmentContent[] = aggResults.randomImages.map(
        (image) => JSON.parse(image),
    );

    const testRunConfig = runConfig
        .filter((config) => config.type === 'CONFIG')
        .at(0);

    const images = allImages.sort(() => 0.5 - Math.random()).slice(0, 6);

    const configValue = JSON.parse(
        testRunConfig?.attachmentValue ?? '',
    ) as AttachmentValueForConfig;

    const browsersUsed: Record<string, number> = {};
    sessions.forEach((sessionObj) => {
        if (browsersUsed[sessionObj.entityName])
            browsersUsed[sessionObj.entityName] += sessionObj.tests;
        else browsersUsed[sessionObj.entityName] = sessionObj.tests;
    });

    const startedAt = dayjs(run.started);
    const total = isTest ? run.tests : JSON.parse(run.suiteSummary).count;

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
        {
            children: (
                <RenderSystemType systemName={configValue.platformName} />
            ),
            key: 'system',
            label: 'System',
        },
    ];

    return (
        <Space direction="vertical">
            <Space>
                <Card
                    bordered
                    style={{ minHeight: '268px' }}
                    title={
                        <Space align="center">
                            <Typography>Executed</Typography>
                            <Counter end={total} />
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
                <TopSuites />
            </Space>
            <Space align="start">
                <Description items={extras} bordered size="small" />
                {images.length > 0 ? (
                    <GalleryOfImages loop={true} maxWidth={'500px'}>
                        {images.map((image, index) => (
                            <CardForAImage
                                url={`${attachmentPrefix}/${testID}/${image.value}`}
                                index={index}
                                key={index}
                                title={image.title}
                                maxHeight={'150px'}
                            />
                        ))}
                    </GalleryOfImages>
                ) : (
                    <></>
                )}
            </Space>
        </Space>
    );
}
