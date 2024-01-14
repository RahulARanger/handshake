// import { imagesTab } from './entity-item';
import React, { useContext, type ReactNode } from 'react';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import Empty from 'antd/lib/empty/index';
import Drawer from 'antd/lib/drawer/index';
import LeftSideOfHeader, { RightSideOfHeader } from './header';
import Dotted from 'src/styles/dotted.module.css';
import RenderProgress from 'src/components/utils/progress-rate';
import Steps from 'antd/lib/steps/index';
import {
    attachedTabItems,
    extractDetailedTestEntities,
    filterTestsAndSuites,
    stepItemsForSuiteTimeline,
} from './extractors';
import { Divider, Tabs } from 'antd/lib';
import TestEntitiesBars from 'src/components/charts/test-bars';
import Layout, { Header } from 'antd/lib/layout/layout';
import { DetailedContext } from 'src/types/records-in-detailed';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import PanelResizerStyles from 'src/styles/panelResizer.module.css';

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

    // const savedAttachments = Object.values(writtenAttachments)
    //     .flat()
    //     .filter(
    //         (attached) =>
    //             tests[attached.entity_id]?.parent ===
    //             selectedSuiteDetails.suiteID,
    //     );

    return (
        <Drawer
            open={properties.open}
            onClose={() => {
                properties.onClose();
                // closeTimeline();
            }}
            // footer={
            //     tags.length > 0 ? (
            //         <Space>
            //             <>Tags:</>
            //             {tags}
            //         </Space>
            //     ) : undefined
            // }
            title={
                <Space style={{ marginBottom: '-5px' }} align="start">
                    <LeftSideOfHeader selected={properties.testID} />
                </Space>
            }
            size="large"
            closeIcon={<CloseOutlined style={{ marginTop: '5px' }} />}
            width={'100%'}
            extra={
                <RightSideOfHeader
                    selected={selectedSuiteDetails}
                    setTestID={setTestID}
                    contributed={contributed}
                    entityName={selectedSuiteDetails.entityName}
                    entityVersion={selectedSuiteDetails.entityVersion}
                    simplified={selectedSuiteDetails.simplified}
                />
            }
            styles={{
                body: { padding: '15px', paddingTop: '10px' },
            }}
            classNames={{ body: Dotted.dotted }}
            className={`${Dotted.dotted} ${Dotted.drawer}`}
            style={{
                opacity: 0.96,
                margin: 0,
            }}
        >
            <Layout
                style={{
                    flexGrow: 1,
                    height: '100%',
                    padding: '0px',
                    lineHeight: 0,
                    backgroundColor: 'transparent',
                }}
            >
                <Header
                    style={{
                        height: '120px',
                        padding: 0,
                        margin: 0,
                        lineHeight: 0,
                        backgroundColor: 'transparent',
                    }}
                >
                    <Space
                        direction="horizontal"
                        align="center"
                        style={{ width: '100%' }}
                        size={50}
                    >
                        <RenderProgress
                            passed={selectedSuiteDetails.Rate[0]}
                            failed={selectedSuiteDetails.Rate[1]}
                            skipped={selectedSuiteDetails.Rate[2]}
                        />
                        <Space direction="vertical">
                            <Steps
                                items={stepItemsForSuiteTimeline(
                                    selectedSuiteDetails.Id,
                                    suites,
                                    run.Started[0],
                                    run.Ended[0],
                                    properties.setTestID,
                                )}
                                size="small"
                                style={{
                                    flexGrow: 2,
                                    width: '100%',
                                }}
                            />
                            <TestEntitiesBars entities={rawSource} />
                        </Space>
                    </Space>
                    <Divider type="horizontal" style={{ marginTop: '6px' }} />
                </Header>

                <Layout
                    style={{
                        lineHeight: 0,
                        padding: 0,
                        margin: 0,
                        backgroundColor: 'transparent',
                    }}
                >
                    <PanelGroup direction="horizontal">
                        <Panel style={{ overflowY: 'auto' }}>
                            {rawSource.length > 0 ? (
                                <Collapse
                                    defaultActiveKey={['Latest Run']}
                                    bordered
                                    size="small"
                                    items={extractDetailedTestEntities(
                                        rawSource,
                                        run.Started[0],
                                        setTestID,
                                    )}
                                    style={{
                                        justifyContent: 'stretch',
                                    }}
                                />
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="No Test Entities were found"
                                    style={{
                                        alignSelf: 'center',
                                        overflowY: 'auto',
                                    }}
                                />
                            )}
                        </Panel>
                        <PanelResizeHandle
                            className={PanelResizerStyles.panelResizer}
                        />
                        <Panel style={{ marginLeft: '3px' }}>
                            <Tabs
                                items={attachedTabItems(
                                    selectedSuiteDetails.Id,
                                    selectedSuiteDetails.errors,
                                    properties.setTestID,
                                )}
                                tabPosition="top"
                                tabBarStyle={{
                                    zIndex: 3,
                                    marginBottom: '3px',
                                }}
                                size="small"
                                animated
                            />
                        </Panel>
                    </PanelGroup>
                </Layout>
            </Layout>
        </Drawer>
    );
}
