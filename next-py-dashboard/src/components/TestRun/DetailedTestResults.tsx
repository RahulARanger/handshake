import React, { useContext, type ReactNode } from "react";
import { getTestRun } from "@/Generators/helper";
import type DetailsOfRun from "@/types/testRun";
import useSWR from "swr";
import Layout from "antd/lib/layout/index";
import Empty from "antd/lib/empty/index";
import Space from "antd/lib/space";
import Tabs from "antd/lib/tabs/index";
import BreadCrumb from "antd/lib/breadcrumb/Breadcrumb";
import RelativeTime from "../Datetime/relativeTime";
import dayjs from "dayjs";
import { crumbsForRun } from "../GridView/Items";
import type { Tab } from "rc-tabs/lib/interface";
import Overview from "./Overview";
import MetaCallContext from "./context";
import GanttChartForTestEntities from "../Charts/GanttChartForTestSuites";
import HomeOutlined from "@ant-design/icons/HomeOutlined";
import TableOutlined from "@ant-design/icons/TableOutlined";
import PartitionOutlined from "@ant-design/icons/PartitionOutlined";
import Tooltip from "antd/lib/tooltip/index";
import TestEntities from "../Table/TestEntites";
import Card from "antd/lib/card/Card";

export default function DetailedTestRun(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<DetailsOfRun>(getTestRun(port, testID));

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

    const items: Tab[] = [
        {
            label: (
                <Tooltip title="Overview">
                    <span>
                        <HomeOutlined />
                        Overview
                    </span>
                </Tooltip>
            ),
            children: <Overview run={data} />,
            key: "overview",
        },
        {
            label: (
                <Tooltip title="Test Entities">
                    <span>
                        <TableOutlined />
                        Test Entities
                    </span>
                </Tooltip>
            ),
            key: "testEntities",
            children: <TestEntities startDate={startDate} />,
        },
        {
            label: "Gantt Chart",
            key: "GanttChart",
            children: (
                <Card
                    style={{
                        marginLeft: "20px",
                        marginRight: "20px",
                    }}
                    size="small"
                >
                    <GanttChartForTestEntities />
                </Card>
            ),
        },
        {
            label: (
                <Tooltip title="Structure">
                    <span>
                        <PartitionOutlined />
                        Structure
                    </span>
                </Tooltip>
            ),
            key: "structure",
        },
    ];

    return (
        <Layout style={{ overflow: "hidden", height: "98vh" }}>
            <Layout.Content
                style={{
                    margin: "12px",
                    marginTop: "2px",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <Tabs
                    items={items}
                    size="small"
                    animated
                    centered
                    // type="card"
                    tabBarExtraContent={{
                        left: (
                            <BreadCrumb
                                items={crumbsForRun(data.projectName)}
                            />
                        ),
                        right: (
                            <RelativeTime
                                dateTime={dayjs(data.ended)}
                                style={{ maxWidth: "120px" }}
                            />
                        ),
                    }}
                />
            </Layout.Content>
        </Layout>
    );
}
