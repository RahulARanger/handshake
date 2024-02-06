import type { SuiteRecordDetails } from 'src/types/test-entity-related';
import type { statusOfEntity } from 'src/types/session-records';
import Counter from 'src/components/utils/counter';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import { RenderDuration } from 'src/components/utils/relative-time';
import ProgressPieChart from 'src/components/charts/status-pie-chart';
import {
    RenderInfo,
    RenderSimpleKeyValue,
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
import Text from 'antd/lib/typography/Text';
import Table from 'antd/lib/table/Table';
import Select from 'antd/lib/select/index';
import Tabs from 'antd/lib/tabs/index';
import { Affix, Tag } from 'antd/lib';
import { standingToColors } from 'src/components/charts/constants';
import Dotted from 'src/styles/dotted.module.css';
import RenderProgress from 'src/components/utils/progress-rate';
import type { OverviewOfEntities } from 'src/types/parsed-overview-records';
import { OverviewContext } from 'src/types/parsed-overview-records';
import { LOCATORS } from 'handshake-utils';

function TopSuites(properties: {
    suites: OverviewOfEntities[];
    isTest: boolean;
}): ReactNode {
    const topNSuites = properties.suites.map((suite) => ({
        key: suite.id,
        ...suite,
    }));

    return (
        <Table
            dataSource={topNSuites}
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
            <Table.Column title="Name" dataIndex="title" width={200} />
            {properties.isTest ? (
                <></>
            ) : (
                <Table.Column
                    title="Rate"
                    dataIndex="Passed"
                    width={80}
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
                width={80}
                render={(value: string, record: SuiteRecordDetails) => (
                    <RelativeTo
                        dateTime={dayjs(value)}
                        style={{
                            marginLeft: '30px',
                            maxWidth: '200px',
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
    const context = useContext(OverviewContext);
    if (context == undefined) return <></>;

    const images = context.randomImages
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);

    return images.length > 0 ? (
        <GalleryOfImages loop={true} maxWidth={'350px'}>
            {images.map((image, index) => (
                <PlainImage
                    url={image.path}
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

function ConfigSet(): ReactNode {
    const context = useContext(OverviewContext);
    if (context == undefined) return <></>;

    const { testRunConfig } = context;

    return (
        <Space align="center" wrap size="large">
            <RenderSimpleKeyValue
                title="Platform"
                value={testRunConfig.platform}
            >
                <RenderSystemType systemName={testRunConfig.platform} />
            </RenderSimpleKeyValue>
            <RenderSimpleKeyValue
                title="File Retries"
                value={'Number of the spec files retried'}
            >
                <Text type="warning">
                    <Counter end={testRunConfig.fileRetries} />
                </Text>
            </RenderSimpleKeyValue>
            <RenderSimpleKeyValue
                title="ExitCode"
                value={'exit code of test run'}
            >
                <Text
                    type={testRunConfig.exitCode === 0 ? 'success' : 'danger'}
                >
                    {testRunConfig.exitCode}
                </Text>
            </RenderSimpleKeyValue>
            <RenderSimpleKeyValue
                title="Max Instances"
                value={
                    'Number of parallel instances set for the test framework'
                }
            >
                <Counter end={testRunConfig.maxInstances} />
            </RenderSimpleKeyValue>
            <RenderSimpleKeyValue
                title="Framework"
                value={'exit code of test run'}
            >
                <Typography>{testRunConfig.framework}</Typography>
            </RenderSimpleKeyValue>
        </Space>
    );
}
export default function Overview(): ReactNode {
    const context = useContext(OverviewContext);
    const [isTest, setTest] = useState<boolean>(false);

    if (context == undefined) return <></>;

    const {
        detailsOfTestRun: run,
        recentTests,
        recentSuites,
        aggResults,
    } = context;

    const startedAt = run.Started[0];

    const total = isTest ? run.Tests : run.Suites;
    const rate = isTest ? run.Rate : run.SuitesSummary;

    return (
        <Card className={Dotted.dotted}>
            <Space
                align="start"
                style={{ width: '100%', justifyContent: 'stretch' }}
            >
                <Space direction="vertical" align="start">
                    <div style={{ width: '350px' }}>
                        <ProgressPieChart
                            rate={rate}
                            isTestCases={isTest}
                            broken={aggResults.brokenTests}
                            noShadow
                        />
                        <Affix
                            style={{
                                position: 'relative',
                                left: '124px',
                                width: '0px',
                                height: '0px',
                                bottom: '123px',
                            }}
                        >
                            <Select
                                key={'switch'}
                                style={{ zIndex: 2 }}
                                variant="borderless"
                                id={LOCATORS.OVERVIEW.testEntitySwitch}
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
                                onChange={(checked: boolean) => {
                                    setTest(checked);
                                }}
                            />
                        </Affix>
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
                            cssClassName={LOCATORS.OVERVIEW.total}
                            end={total}
                            style={{
                                fontSize: '2.5rem',
                                textShadow: 'rgba(0,208,255,0.9) 0px 0px 10px',
                                whiteSpace: 'nowrap',
                            }}
                            maxDigits={run.Tests}
                            suffix={isTest ? ' Tests' : ' Suites'}
                        />
                        <RenderProgress
                            passed={rate[0]}
                            failed={rate[1]}
                            skipped={rate[2]}
                            broken={isTest ? aggResults.brokenTests : undefined}
                        />
                    </Space>
                    <Space style={{ flexWrap: 'wrap', gap: '10px' }}>
                        {[
                            {
                                key: 'Status',
                                value: (
                                    <Space>
                                        <RenderStatus value={run.Status} />
                                        <Typography
                                            style={{
                                                color: standingToColors[
                                                    run.Status
                                                ],
                                            }}
                                        >
                                            {run.Status.charAt(
                                                0,
                                            ).toUpperCase() +
                                                run.Status.slice(
                                                    1,
                                                ).toLowerCase()}
                                        </Typography>
                                    </Space>
                                ),
                                color: standingToColors[run.Status],
                            },
                            {
                                key: 'Duration',
                                value: (
                                    <RenderDuration
                                        value={run.Duration}
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
                                        secondDateTime={run.Ended[0]}
                                        autoPlay={true}
                                    />
                                ),
                                color: 'purple',
                            },
                        ].map((item) => (
                            <RenderInfo
                                key={item.key}
                                itemKey={item.key}
                                color={item.color}
                                value={item.value}
                            />
                        ))}
                    </Space>
                    <Tabs
                        tabBarExtraContent={
                            <Space>
                                {aggResults.isRecent ? (
                                    <Tag
                                        color="blue"
                                        id={LOCATORS.OVERVIEW.recentRunBadge}
                                    >
                                        Recent Run
                                    </Tag>
                                ) : (
                                    <></>
                                )}
                                {/* <Tag color="red">Bailed</Tag> */}
                            </Space>
                        }
                        items={[
                            {
                                key: 'recent',
                                label: 'Recent',
                                children: (
                                    <TopSuites
                                        suites={
                                            isTest ? recentTests : recentSuites
                                        }
                                        isTest={isTest}
                                    />
                                ),
                            },
                            {
                                key: 'config',
                                label: 'Config',
                                children: <ConfigSet />,
                            },
                        ]}
                    />
                </Space>
            </Space>
        </Card>
    );
}
