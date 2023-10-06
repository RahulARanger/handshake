import React, { useState, useContext, type ReactNode } from "react";
import { getTestRun } from "@/Generators/helper";
import type DetailsOfRun from "@/types/testRun";
import useSWR from "swr";
import Layout from "antd/lib/layout/index";
import Empty from "antd/lib/empty/index";
import Space from "antd/lib/space";
import Tabs from "antd/lib/tabs/index";
import BreadCrumb from "antd/lib/breadcrumb/Breadcrumb";
import RelativeTo from "../Datetime/relativeTime";
import dayjs from "dayjs";
import { crumbsForRun } from "../ListOfRuns/Items";
import type { Tab } from "rc-tabs/lib/interface";
import Overview from "./Overview";
import MetaCallContext from "./context";
import GanttChartForTestEntities from "../Charts/GanttChartForTestSuites";
import HomeOutlined from "@ant-design/icons/HomeOutlined";
import TableOutlined from "@ant-design/icons/TableOutlined";
import PartitionOutlined from "@ant-design/icons/PartitionOutlined";
import TestEntities from "@/components/TestRun/TestEntities";
import Card from "antd/lib/card/Card";
import { dateFormatUsed } from "../Datetime/format";
import {
    ganttChartTab,
    gridViewMode,
    overviewTab,
    testEntitiesTab,
} from "@/types/detailedTestRunPage";
import TestEntityDrawer from "./TestEntities/TestEntity";

export default function DetailedTestRun(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<DetailsOfRun>(getTestRun(port, testID));
    const [viewMode, setViewMode] = useState<string>(gridViewMode);
    const [tab, setTab] = useState<string>(overviewTab);
    const [detailed, showDetailed] = useState<string>();
    const [openDetailed, setOpenDetailed] = useState<boolean>(false);

    if (data == null) {
        return (
            <Layout style={{ height: "100%" }}>
                <Space
                    direction="horizontal"
                    style={{ height: "100%", justifyContent: "center" }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={`Report: ${
                            testID ?? "not-passed"
                        } is not available. Please raise an issue if you think it is a valid one.`}
                    />
                </Space>
            </Layout>
        );
    }

    const startDate = dayjs(data.started);
    const helper = (id: string): void => {
        showDetailed(id);
        setOpenDetailed(true);
    };

    const items: Tab[] = [
        {
            label: (
                <span>
                    <HomeOutlined />
                    Overview
                </span>
            ),
            children: <Overview run={data} onTabSelected={setTab} />,
            key: overviewTab,
        },
        {
            label: (
                <span>
                    {viewMode === gridViewMode ? (
                        <TableOutlined />
                    ) : (
                        <PartitionOutlined />
                    )}
                    Test Entities
                </span>
            ),
            key: testEntitiesTab,
            children: (
                <TestEntities startDate={startDate} setIcon={setViewMode} />
            ),
        },
        {
            label: "Gantt Chart",
            key: ganttChartTab,
            children: (
                <Card
                    style={{
                        padding: "3px",
                    }}
                    size="small"
                >
                    <GanttChartForTestEntities setOpenDrilldown={helper} />
                    <TestEntityDrawer
                        open={openDetailed}
                        testID={detailed}
                        onClose={() => {
                            setOpenDetailed(false);
                        }}
                        setTestID={helper}
                    />
                </Card>
            ),
        },
    ];

    return (
        <Layout style={{ overflow: "hidden", height: "99.3vh" }}>
            <Layout.Content
                style={{
                    marginLeft: "12px",
                    marginTop: "2px",
                    overflowY: "auto",
                    marginBottom: "3px",
                    overflowX: "hidden",
                }}
            >
                <Tabs
                    items={items}
                    size="small"
                    animated
                    centered
                    activeKey={tab}
                    onChange={(activeKey) => {
                        setTab(activeKey);
                    }}
                    // type="card"
                    tabBarExtraContent={{
                        left: (
                            <BreadCrumb
                                items={crumbsForRun(data.projectName)}
                            />
                        ),
                        right: (
                            <RelativeTo
                                dateTime={dayjs(data.ended)}
                                style={{ maxWidth: "130px" }}
                                format={dateFormatUsed}
                            />
                        ),
                    }}
                />
            </Layout.Content>
        </Layout>
    );
}
