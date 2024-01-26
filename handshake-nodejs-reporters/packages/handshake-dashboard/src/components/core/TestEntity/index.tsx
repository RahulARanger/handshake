// import { imagesTab } from './entity-item';
import React, { useContext, type ReactNode } from 'react';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import Empty from 'antd/lib/empty/index';
import Drawer from 'antd/lib/drawer/index';
import BadgeLayer, { RightSideOfBoard } from './header';
import Dotted from 'src/styles/dotted.module.css';
import Text from 'antd/lib/typography/Text';

import Steps from 'antd/lib/steps/index';
import {
    attachedTabItems,
    extractDetailedTestEntities,
    filterTestsAndSuites,
    stepItemsForSuiteTimeline,
} from './extractors';
import { Divider, Tabs } from 'antd/lib';
import TestEntitiesBars from 'src/components/charts/test-bars';
import Layout, { Content, Header } from 'antd/lib/layout/layout';
import { DetailedContext } from 'src/types/records-in-detailed';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import PanelResizerStyles from 'src/styles/panelResizer.module.css';
import Sider from 'antd/lib/layout/Sider';
import ProgressPieChart from 'src/components/charts/status-pie-chart';
import Paragraph from 'antd/lib/typography/Paragraph';
import RelativeTo, {
    DurationText,
} from 'src/components/utils/Datetime/relative-time';

export default function TestEntityDrawer(properties: {
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

    // const tags = JSON.parse(selectedSuiteDetails.Tags).map((tag: SuiteTag) => {
    //     return (
    //         <Badge
    //             key={tag.astNodeId}
    //             color="geekblue"
    //             count={tag.name}
    //             style={{ color: 'white' }}
    //         />
    //     );
    // });

    const contributed = selectedSuiteDetails.Contribution * 100;

    return (
        <Layout hasSider>
            <Layout>
                <Header
                    style={{
                        width: '100%',
                        height: '50px',
                        backgroundColor: 'transparent',
                    }}
                >
                    <TestEntitiesBars entities={rawSource} />
                </Header>
                <Content>
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
                            <BadgeLayer selected={selectedSuiteDetails} />
                        </Divider>
                        <Collapse
                            defaultActiveKey={['Latest Run']}
                            size="small"
                            bordered={false}
                            items={extractDetailedTestEntities(
                                rawSource,
                                properties.setTestID,
                            )}
                            style={{
                                justifyContent: 'stretch',
                            }}
                        />
                    </Space>
                </Content>
            </Layout>
            <Sider theme="light" width={'400px'} style={{ padding: '6px' }}>
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
                    <Divider
                        type="horizontal"
                        style={{
                            width: '360px',
                            position: 'relative',
                            marginBottom: '0px',
                        }}
                    >
                        <Space align="start">
                            <RelativeTo
                                dateTime={selectedSuiteDetails.Started[0]}
                                secondDateTime={selectedSuiteDetails.Ended[0]}
                                wrt={run.Started[0]}
                                style={{ fontWeight: 'normal' }}
                            />
                            <Text style={{ fontWeight: 'normal' }} italic>
                                <DurationText
                                    duration={selectedSuiteDetails.Duration}
                                />
                            </Text>
                        </Space>
                    </Divider>
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
