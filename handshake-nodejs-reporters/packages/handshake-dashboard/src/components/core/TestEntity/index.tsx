import React, { useContext, type ReactNode } from 'react';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import BadgeLayer, { DurationLayer, RightSideOfBoard } from './header';
import {
    extractDetailedTestEntities,
    filterTestsAndSuites,
} from './extractors';
import Button from 'antd/lib/button/button';
import { Affix, Divider, Tag } from 'antd/lib';
import Text from 'antd/lib/typography/Text';
import TestEntitiesBars from 'src/components/charts/test-bars';
import Layout, { Content, Header } from 'antd/lib/layout/layout';
import { DetailedContext } from 'src/types/records-in-detailed';
import Sider from 'antd/lib/layout/Sider';
import ProgressPieChart from 'src/components/charts/status-pie-chart';

import PreviewGroup from 'antd/lib/image/PreviewGroup';

import Paragraph from 'antd/lib/typography/Paragraph';

export default function DetailedTestEntityWindow(properties: {
    open: boolean;
    onClose: () => void;
    testID?: string;
    setTestID: (testID: string) => void;
}): ReactNode {
    const context = useContext(DetailedContext);
    if (context == undefined) return <></>;
    if (properties.testID == undefined) return <></>;

    const { detailsOfTestRun: run, suites, tests } = context;

    const selectedSuiteDetails = suites[properties.testID];

    const setTestID = (detailed: string) => {
        properties.setTestID(detailed);
    };

    const rawSource = filterTestsAndSuites(
        selectedSuiteDetails.Id,
        suites,
        tests,
    );

    const contributed = selectedSuiteDetails.Contribution * 100;

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
            >
                <Header
                    style={{
                        width: '100%',
                        height: '50px',
                        paddingTop: '4px',
                        // https://uigradients.com/#LoveCouple
                        background:
                            'linear-gradient(to right, #3a6186, #89253e)',
                    }}
                >
                    <Affix
                        offsetTop={10}
                        style={{
                            position: 'relative',
                            border: '1px solid grey',
                            top: '-12px',
                            left: '-60px',
                            width: '0px',
                            height: '0px',
                        }}
                    >
                        <Button
                            style={{
                                color: 'whitesmoke',
                                backdropFilter: 'blur(12px)',
                                fontWeight: 'bolder',
                                backgroundColor: 'transparent',
                                border: '1px solid transparent',
                            }}
                            onClick={properties.onClose}
                            shape="round"
                        >
                            ⟵
                        </Button>
                    </Affix>
                    <TestEntitiesBars
                        entities={rawSource}
                        onClick={(testEntity) => {
                            document
                                // eslint-disable-next-line unicorn/prefer-query-selector
                                .getElementById(testEntity)
                                ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    />
                </Header>
                <Content
                    style={{
                        overflowY: 'auto',
                        // inspired from https://uigradients.com/#RedOcean and https://uigradients.com/#Netflix
                        background:
                            'linear-gradient(to right,  #1f1c18, #141e30)',
                    }}
                >
                    <Space
                        style={{ width: '100%', paddingTop: '6px' }}
                        direction="vertical"
                    >
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
            >
                <Space
                    direction="vertical"
                    style={{ width: '100%' }}
                    align="center"
                >
                    <RightSideOfBoard
                        contributed={contributed}
                        selected={selectedSuiteDetails}
                        setTestID={setTestID}
                    />
                    <Affix
                        style={{
                            position: 'relative',
                            right: '-.5%',
                        }}
                    >
                        <Text italic>{selectedSuiteDetails.File}</Text>
                    </Affix>
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
                    <div style={{ width: '350px' }}>
                        <ProgressPieChart
                            rate={selectedSuiteDetails.Rate}
                            fullRound
                            forceText="Tests"
                        />
                    </div>
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
