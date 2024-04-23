import React, { useContext, useState, type ReactNode } from 'react';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import BadgeLayer, { DurationLayer, RightSideOfBoard } from './header';
import {
    extractDetailedTestEntities,
    filterTestsAndSuites,
} from './extractors';
import Button from 'antd/lib/button/button';
import { Divider, Select, Tag, Tooltip } from 'antd/lib';
import TestEntitiesBars from 'components/charts/test-bars';
import Layout, { Content, Header } from 'antd/lib/layout/layout';
import { DetailedContext } from 'types/records-in-detailed';
import Sider from 'antd/lib/layout/Sider';
import ProgressPieChart from 'components/charts/status-pie-chart';
import CardStyles from 'styles/card.module.css';
import PreviewGroup from 'antd/lib/image/PreviewGroup';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import Paragraph from 'antd/lib/typography/Paragraph';
import { SwitchValues } from 'components/charts/stacked-bar-chart';
import type { ParsedSuiteRecord } from 'types/parsed-records';
import { RenderFilePath } from 'components/renderers';

function RollupPieChart(properties: { suite: ParsedSuiteRecord }) {
    const [showRollup, setShowRollup] = useState<boolean>(false);

    return (
        <div
            style={{
                width: '350px',
                marginTop: '-40px',
            }}
        >
            <SwitchValues
                defaultIsRollup={showRollup}
                onChange={(isRollup) => setShowRollup(isRollup)}
                style={{
                    position: 'relative',
                    top: '40px',
                    zIndex: 3,
                    right: '-72%',
                }}
            />
            <ProgressPieChart
                rate={
                    showRollup
                        ? properties.suite.RollupValues
                        : properties.suite.Rate
                }
                fullRound
                forceText="Tests"
            />
        </div>
    );
}

export default function DetailedTestEntityWindow(properties: {
    open: boolean;
    onClose: () => void;
    testID?: string;
    setTestID: (testID: string) => void;
}): ReactNode {
    const context = useContext(DetailedContext);

    if (context == undefined) return <></>;
    if (properties.testID == undefined) return <></>;

    const { detailsOfTestRun: run, suites, tests, retriedRecords } = context;

    const selectedSuiteDetails = suites[properties.testID];

    const setTestID = (detailed: string) => {
        properties.setTestID(detailed);
    };

    const rawSource = filterTestsAndSuites(
        selectedSuiteDetails.Id,
        suites,
        tests,
    );

    const records = retriedRecords[properties.testID];
    const hasRetries = records && records?.length > 1;

    return (
        <Layout
            hasSider
            style={{
                overflow: 'clip',
                height: '100%',
            }}
        >
            <Layout
                style={{
                    overflow: 'clip',
                    height: '100%',
                    marginRight: '5px',
                    borderRadius: '10px',
                }}
                className={CardStyles.boardCard}
            >
                <Header
                    style={{
                        width: '100%',
                        height: '60px',
                        paddingTop: '4px',
                        // https://uigradients.com/#LoveCouple
                        background:
                            'linear-gradient(to right, #3a6186, #89253e)',
                        padding: '0px',
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <TestEntitiesBars
                        entities={rawSource}
                        onClick={(testEntity) => {
                            document
                                // eslint-disable-next-line unicorn/prefer-query-selector
                                .getElementById(testEntity)
                                ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    />
                    <Tooltip title="Go back to previous screen">
                        <Button
                            style={{
                                backdropFilter: 'blur(12px)',
                                fontWeight: 'bolder',
                                background: 'transparent',
                                border: '1px solid transparent',
                            }}
                            className={'smooth-box'}
                            icon={
                                <CloseCircleOutlined
                                    size={10}
                                    style={{
                                        color: 'white',
                                        fontWeight: 'bolder',
                                    }}
                                />
                            }
                            onClick={properties.onClose}
                        />
                    </Tooltip>
                </Header>
                <Content
                    style={{
                        overflowY: 'auto',
                    }}
                >
                    <Space
                        style={{ width: '100%', paddingTop: '6px' }}
                        direction="vertical"
                    >
                        {/* <Space style={{ padding: '6px' }}>
                            <Input
                                variant="borderless"
                                className="smooth-box"
                                style={{ width: '100%' }}
                            />
                        </Space> */}
                        <Divider
                            type="horizontal"
                            style={{
                                width: '100%',
                                marginBottom: '0px',
                            }}
                        >
                            {selectedSuiteDetails.Tags?.length > 0 ? (
                                selectedSuiteDetails.Tags.map((tag) => (
                                    <Tag color="blue" key={tag.astNodeId}>
                                        {tag.name}
                                    </Tag>
                                ))
                            ) : (
                                <BadgeLayer selected={selectedSuiteDetails} />
                            )}
                            {hasRetries ? (
                                <Select
                                    style={{ width: 120 }}
                                    defaultValue={properties.testID}
                                    variant="borderless"
                                    options={records.tests.map(
                                        (test, index) => ({
                                            value: test,
                                            label:
                                                index ===
                                                records.tests.length - 1
                                                    ? 'Current Run'
                                                    : `Retried #${index + 1}`,
                                        }),
                                    )}
                                    onChange={(value) =>
                                        properties.setTestID(value)
                                    }
                                />
                            ) : (
                                <></>
                            )}
                        </Divider>
                        <PreviewGroup>
                            <Collapse
                                defaultActiveKey={['Latest Run']}
                                size="small"
                                bordered={false}
                                items={extractDetailedTestEntities(
                                    rawSource,
                                    properties.setTestID,
                                    run.Started[0],
                                )}
                                style={{
                                    justifyContent: 'stretch',
                                }}
                            />
                        </PreviewGroup>
                    </Space>
                </Content>
            </Layout>
            <Sider
                theme="light"
                width={'400px'}
                style={{
                    padding: '6px',
                    overflow: 'auto',
                    height: '100%',
                    borderRadius: '10px',
                }}
                className={CardStyles.card}
            >
                <Space
                    direction="vertical"
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'transparent',
                    }}
                    align="center"
                    size="small"
                >
                    <RightSideOfBoard
                        selected={selectedSuiteDetails}
                        setTestID={setTestID}
                        totalTests={run.Tests}
                        showContribution={
                            !records || records.suite_id === properties.testID
                        }
                    />
                    <RenderFilePath
                        relativePath={selectedSuiteDetails.File}
                        italic
                    />
                    <Divider
                        type="horizontal"
                        style={{
                            width: '360px',
                            position: 'relative',
                            top: '-20px',
                            marginBottom: '0px',
                        }}
                    >
                        <BadgeLayer selected={selectedSuiteDetails} />
                    </Divider>
                    <RollupPieChart suite={selectedSuiteDetails} />
                    <DurationLayer
                        selected={selectedSuiteDetails}
                        wrt={run.Started[0]}
                        offsetTop={5}
                    />
                    <Paragraph
                        type="secondary"
                        style={{ paddingLeft: '6px', paddingRight: '6px' }}
                    >
                        {selectedSuiteDetails.Desc}
                    </Paragraph>
                </Space>
            </Sider>
        </Layout>
    );
}
