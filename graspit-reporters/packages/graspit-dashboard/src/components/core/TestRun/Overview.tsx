import type TestRunRecord from 'src/types/testRunRecords';
import {
    getEntityLevelAttachment,
    getSessions,
    getSuites,
} from 'src/Generators/helper';
import type { SuiteRecordDetails } from 'src/types/testEntityRelated';
import type { statusOfEntity } from 'src/types/sessionRecords';
import {
    dateFormatUsed,
    dateTimeFormatUsed,
} from 'src/components/utils/Datetime/format';
import Counter, { StatisticNumber } from 'src/components/utils/counter';
import RelativeTo from 'src/components/utils/Datetime/relativeTime';
import ProgressPieChart from 'src/components/charts/StatusPieChart';
import {
    RenderBrowserType,
    RenderDuration,
    RenderStatus,
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
            style={{ flexShrink: 1, minWidth: '300px' }}
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
                        width={180}
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
                width={120}
                render={(value: string) =>
                    dayjs(value).format(dateTimeFormatUsed)
                }
            />
            <Table.Column
                title="Ended"
                width={120}
                dataIndex="ended"
                render={(value: string) =>
                    dayjs(value).format(dateTimeFormatUsed)
                }
            />
        </Table>
    );
}

export default function Overview(props: {
    run: TestRunRecord;
    onTabSelected: (tab: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: attachments } = useSWR<AttachmentDetails>(
        getEntityLevelAttachment(port, testID),
    );
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const [isTest, setTest] = useState<boolean>(true);

    if (attachments == null || sessions == null) return <></>;

    const allImages = Object.values(attachments)
        .flat(1)
        .filter((image) => image.type === 'PNG');

    const specFiles = new Set(
        suites?.['@order'].map((suite) => suites[suite].file),
    );

    const images = allImages.sort(() => 0.5 - Math.random()).slice(0, 6);

    const browsersUsed: Record<string, number> = {};
    Object.keys(sessions).forEach((session) => {
        const sessionObj = sessions[session];
        if (browsersUsed[sessionObj.browserName])
            browsersUsed[sessionObj.browserName] += sessionObj.tests;
        else browsersUsed[sessionObj.browserName] = sessionObj.tests;
    });

    const startedAt = dayjs(props.run.started);
    const total = isTest
        ? props.run.tests
        : JSON.parse(props.run.suiteSummary).count;

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
                <Card bordered size="small">
                    <Space split={<Divider type="vertical" />}>
                        {allImages.length > 0 ? (
                            <StatisticNumber
                                title="Attachments"
                                end={allImages.length}
                            />
                        ) : (
                            <></>
                        )}
                        <StatisticNumber
                            title="Spec Files"
                            end={specFiles.size}
                        />
                        <StatisticNumber
                            title="Sessions"
                            end={Object.values(sessions).length}
                        />
                        {Object.keys(browsersUsed).map((browser) => (
                            <StatisticNumber
                                key={browser}
                                title={
                                    <RenderBrowserType browserName={browser} />
                                }
                                end={browsersUsed[browser]}
                            />
                        ))}
                    </Space>
                </Card>
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
