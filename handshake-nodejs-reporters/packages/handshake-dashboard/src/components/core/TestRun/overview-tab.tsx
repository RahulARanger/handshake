import type { SuiteRecordDetails } from 'src/types/test-entity-related';
import type { statusOfEntity } from 'src/types/session-records';
import Counter from '@/components/utils/counter';
import RelativeTo, {
    RenderDuration,
} from 'src/components/utils/Datetime/relative-time';
import ProgressPieChart from 'src/components/charts/status-pie-chart';
import {
    RenderFrameworkUsed,
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
import Typography from 'antd/lib/typography/Typography';
import Table from 'antd/lib/table/Table';
import Select from 'antd/lib/select/index';
import Tabs from 'antd/lib/tabs/index';
import { Tag } from 'antd/lib';
import { standingToColors } from 'src/components/charts/constants';
import RenderProgress from 'src/components/utils/progress-rate';
import type { OverviewOfEntities } from 'src/types/parsed-overview-records';
import { OverviewContext } from 'src/types/parsed-overview-records';
import TextShadow from '@/styles/text-shadow.module.css';
import { LOCATORS } from 'handshake-utils';
import CardStyles from 'src/styles/card.module.css';
import Ribbon from 'antd/lib/badge/Ribbon';
import Tree from 'antd/lib/tree/Tree';

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
            style={{ backgroundColor: 'transparent' }}
            scroll={{ x: 'max-content' }}
        >
            {properties.isTest ? (
                <Table.Column
                    title="Status"
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
            <Table.Column
                title="Name"
                dataIndex="title"
                className={TextShadow.suiteName}
            />
            {properties.isTest ? (
                <></>
            ) : (
                <Table.Column
                    title="Rate"
                    dataIndex="Passed"
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
            {properties.isTest ? (
                <></>
            ) : (
                <Table.Column
                    title="Errors"
                    dataIndex="numberOfErrors"
                    align="center"
                    render={(_: number) => <Counter end={_ ?? 0} />}
                />
            )}
            <Table.Column
                dataIndex="duration"
                title="Duration"
                align="center"
                render={(value: number) => (
                    <RenderDuration
                        autoPlay
                        duration={dayjs.duration({ milliseconds: value })}
                    />
                )}
                responsive={['lg']}
            />
            <Table.Column
                dataIndex="started"
                title="Range"
                align="center"
                render={(value: string, record: SuiteRecordDetails) => (
                    <RelativeTo
                        dateTime={dayjs(value)}
                        style={{
                            marginLeft: '30px',
                            maxWidth: '200px',
                        }}
                        secondDateTime={dayjs(record.ended)}
                        autoPlay
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
        <Table
            dataSource={[
                {
                    Note: 'Platform',
                    Configured: (
                        <RenderSystemType systemName={testRunConfig.platform} />
                    ),
                    Description: 'Executed in this platform',
                },
                {
                    Note: 'Framework',
                    Configured: (
                        <RenderFrameworkUsed
                            frameworks={testRunConfig.frameworks}
                        />
                    ),
                    Description: 'Frameworks used.',
                },
                {
                    Note: 'ExitCode',
                    Configured: <Counter end={testRunConfig.exitCode} />,
                    Description: 'Exit Code of Test Run.',
                },
                {
                    Note: 'MaxInstances',
                    Configured: <Counter end={testRunConfig.maxInstances} />,
                    Description: 'Maximum number of parallel instances set.',
                },
            ]}
            size="small"
            bordered
            pagination={false}
            scroll={{ y: 200, x: 'max-content' }}
        >
            <Table.Column
                dataIndex="Note"
                title="Note"
                width={60}
                align="center"
                fixed="left"
            />

            <Table.Column
                dataIndex="Configured"
                title="Configured"
                align="center"
                width={40}
                render={(value: ReactNode) => value}
            />
            <Table.Column
                dataIndex="Description"
                align="right"
                title="Description"
                width={120}
            />
        </Table>
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
        <section className={CardStyles.boardCard}>
            <Space
                direction="vertical"
                className={`smooth-box`}
                style={{ width: '100%', padding: '12px' }}
            >
                <Space
                    align="start"
                    style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'stretch',
                    }}
                    size={'large'}
                >
                    <Ribbon
                        text={
                            <Space>
                                <RenderStatus value={run.Status} />
                                <Typography
                                    style={{
                                        color: standingToColors[run.Status],
                                    }}
                                >
                                    {run.Status.charAt(0).toUpperCase() +
                                        run.Status.slice(1).toLowerCase()}
                                </Typography>
                            </Space>
                        }
                        color="#1A0014"
                        style={{
                            border: '1px solid #370224',
                            paddingTop: '3px',
                            paddingBottom: '3px',
                        }}
                    >
                        <div style={{ width: '350px' }} className="smooth-box">
                            <ProgressPieChart
                                rate={rate}
                                isTestCases={isTest}
                                broken={aggResults.brokenTests}
                                noShadow
                                fullRound
                            />
                        </div>
                    </Ribbon>
                    <Space>
                        <Space
                            size="large"
                            direction="vertical"
                            style={{ height: '100%' }}
                            styles={{
                                item: { width: '100%' },
                            }}
                        >
                            <Space
                                style={{
                                    flexDirection: 'row',
                                    width: '100%',
                                }}
                                align="center"
                                size="middle"
                            >
                                <article
                                    style={{
                                        backdropFilter: 'blur(20px)',
                                    }}
                                >
                                    <Space
                                        align="center"
                                        className="smooth-box"
                                        style={{
                                            fontSize: '2.6rem',
                                            textShadow:
                                                'rgba(0,208,255,0.9) 0px 0px 10px',
                                            whiteSpace: 'nowrap',
                                            padding: '6px',
                                            paddingLeft: '20px',
                                            paddingRight: '12px',
                                            borderRadius: '25px',
                                        }}
                                    >
                                        <Counter
                                            end={total}
                                            maxDigits={run.Tests}
                                        />
                                        <Select
                                            key={'switch'}
                                            size="large"
                                            variant="borderless"
                                            id={
                                                LOCATORS.OVERVIEW
                                                    .testEntitySwitch
                                            }
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
                                    </Space>
                                </article>
                                <Space
                                    className="smooth-box"
                                    align="end"
                                    style={{
                                        textShadow:
                                            'rgba(0,208,255,0.9) 0px 0px 10px',

                                        padding: '6px',
                                        paddingLeft: '20px',
                                        paddingRight: '12px',
                                        borderRadius: '25px',
                                        textAlign: 'right',
                                    }}
                                    direction="vertical"
                                >
                                    <RelativeTo
                                        dateTime={startedAt}
                                        secondDateTime={run.Ended[0]}
                                        autoPlay={true}
                                        width="170px"
                                        prefix="It Started "
                                    />
                                    <RenderDuration
                                        duration={run.Duration}
                                        autoPlay={true}
                                        width="150px"
                                        prefix="Ran for "
                                    />
                                </Space>
                                {/* <Tree treeData={[{ title: 'Hi' }]} /> */}
                            </Space>

                            <RenderProgress
                                passed={rate[0]}
                                failed={rate[1]}
                                skipped={rate[2]}
                                broken={
                                    isTest ? aggResults.brokenTests : undefined
                                }
                            />
                        </Space>
                        <PreviewForImages />
                    </Space>
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
                            label: `Recent ${isTest ? 'Tests' : 'Suites'}`,
                            children: (
                                <TopSuites
                                    suites={isTest ? recentTests : recentSuites}
                                    isTest={isTest}
                                />
                            ),
                        },
                        {
                            key: 'note',
                            label: 'Note',
                            children: <ConfigSet />,
                        },
                    ]}
                />
            </Space>
        </section>
    );
}
