import type TestRunRecord from 'src/types/testRunRecords';
import {
    getEntityLevelAttachment,
    getSessions,
    getSuites,
    getTestRunConfig,
} from 'src/Generators/helper';
import type { SuiteRecordDetails } from 'src/types/testEntityRelated';
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
import { type SuiteDetails } from 'src/types/generatedResponse';
import type {
    AttachmentDetails,
    SessionDetails,
} from 'src/types/generatedResponse';
import { testEntitiesTab } from 'src/types/uiConstants';

import React, { useState, type ReactNode, useContext } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

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

function TopSuites(props: {
    startedAt: Dayjs;
    setTab: (tab: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<SuiteDetails>(getSuites(port, testID));
    if (data == null) return <></>;

    const top5Suites = data['@order']
        .slice(-5, data?.['@order'].length)
        .map((suite) => ({ key: data[suite].suiteID, ...data[suite] }));

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
                            onClick={() => {
                                props.setTab(testEntitiesTab);
                            }}
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
            <Table.Column title="Name" dataIndex="title" width={120} />
            <Table.Column
                title="Rate"
                dataIndex="Passed"
                width={100}
                render={(_: number, record: SuiteRecordDetails) => (
                    <RenderPassedRate
                        value={[record.passed, record.failed, record.skipped]}
                        width={271}
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

export default function Overview(props: {
    run: TestRunRecord;
    onTabSelected: (tab: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);

    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const { data: attachments } = useSWR<AttachmentDetails>(
        getEntityLevelAttachment(port, testID),
    );
    const { data: runConfig } = useSWR<TestRunConfig[]>(
        getTestRunConfig(port, testID),
    );

    const [isTest, setTest] = useState<boolean>(true);

    if (attachments == null || sessions == null || runConfig == null)
        return <></>;

    const allImages = Object.values(attachments)
        .flat(1)
        .filter((image) => image.type === 'PNG');

    const testRunConfig = runConfig
        .filter((config) => config.type === 'CONFIG')
        .at(0);

    const specFiles = new Set(
        suites?.['@order'].map((suite) => suites[suite].file),
    );
    const images = allImages.sort(() => 0.5 - Math.random()).slice(0, 6);

    const configValue = JSON.parse(
        testRunConfig?.attachmentValue ?? '',
    ) as AttachmentValueForConfig;

    const browsersUsed: Record<string, number> = {};
    Object.keys(sessions).forEach((session) => {
        const sessionObj = sessions[session];
        if (browsersUsed[sessionObj.entityName])
            browsersUsed[sessionObj.entityName] += sessionObj.tests;
        else browsersUsed[sessionObj.entityName] = sessionObj.tests;
    });

    const startedAt = dayjs(props.run.started);
    const total = isTest
        ? props.run.tests
        : JSON.parse(props.run.suiteSummary).count;

    const extras: DescriptionsProps['items'] = [
        {
            key: 'suites',
            label: 'Suites',
            children: <StatisticNumber end={suites?.['@order'].length ?? 0} />,
        },
        {
            key: 'files',
            label: 'Spec Files',
            children: <StatisticNumber end={specFiles.size} />,
        },
        {
            key: 'sessions',
            label: 'Sessions',
            children: <StatisticNumber end={Object.values(sessions).length} />,
        },
        {
            key: 'attachments',
            label: 'Attachments',
            children: <StatisticNumber end={allImages.length} />,
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
                                            secondDateTime={dayjs(
                                                props.run.ended,
                                            )}
                                        />
                                        <RenderDuration
                                            value={dayjs.duration(
                                                props.run.duration,
                                            )}
                                        />
                                    </Space>
                                </Tooltip>
                            }
                        />,
                    ]}
                >
                    <ProgressPieChart run={props.run} isTestCases={isTest} />
                </Card>
                <TopSuites startedAt={startedAt} setTab={props.onTabSelected} />
            </Space>
            <Space align="start">
                <Description items={extras} bordered size="small" />
                {images.length > 0 ? (
                    <GalleryOfImages loop={true} maxWidth={'500px'}>
                        {images.map((image, index) => (
                            <CardForAImage
                                image={image}
                                index={index}
                                key={index}
                                maxHeight={'150px'}
                                hideDesc={true}
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
