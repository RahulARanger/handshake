import type DetailsOfRun from "@/types/testRun";
import React, { useState, type ReactNode } from "react";
import {
    type QuickPreviewForTestRun,
    parseDetailedTestRun,
} from "../parseUtils";
import RenderTimeRelativeToStart, {
    RenderDuration,
    RenderStatus,
} from "../Table/renderers";
import RenderPassedRate from "@/components/Charts/StackedBarChart";
import Switch from "antd/lib/switch";
import List from "antd/lib/list";
import Space from "antd/lib/space";
import Collapse from "antd/lib/collapse/Collapse";
import Card from "antd/lib/card/Card";
import dayjs from "dayjs";
import Layout from "antd/lib/layout/index";
import AreaChartForRuns from "@/components/Charts/AreaChartForRuns";
import HeaderStyles from "@/styles/header.module.css";
import Empty from "antd/lib/empty/index";
import Tooltip from "antd/lib/tooltip/index";
import Divider from "antd/lib/divider/index";
import Select from "antd/lib/select/index";
import HistogramForDuration from "../Charts/HistogramForDuration";

function RunCard(props: { run: QuickPreviewForTestRun }): ReactNode {
    const formatForDate = "MMM, ddd DD YYYY  ";
    const [isTest, showTest] = useState(true);
    const item = props.run;

    return (
        <List.Item
            key={item.Link}
            actions={[
                <Space key={"space"}>
                    <RenderPassedRate
                        value={isTest ? item.Rate : item.SuitesSummary}
                        key={"chart"}
                    />
                    <Switch
                        key={"switch"}
                        defaultChecked
                        size="small"
                        checkedChildren={<>Tests</>}
                        unCheckedChildren={<>Suites</>}
                        onChange={(checked) => {
                            showTest(checked);
                        }}
                        checked={isTest}
                    />
                </Space>,
            ]}
            // extra={
            //   <img
            //     width={272}
            //     alt="logo"
            //     src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
            //   />
            // }
        >
            <List.Item.Meta
                title={
                    <a href={item.Link}>{`${item.Started[0].format(
                        formatForDate
                    )} - ${item.Title}`}</a>
                }
                description={
                    <Tooltip
                        title="Start Time | End Time | Duration (in s)"
                        color="volcano"
                        placement="bottomRight"
                        arrow
                    >
                        <Space
                            style={{ maxWidth: "100px" }}
                            size="small"
                            align="baseline"
                        >
                            <RenderTimeRelativeToStart value={item.Started} />
                            <Divider type="vertical" />
                            <RenderTimeRelativeToStart value={item.Ended} />
                            <Divider type="vertical" />
                            <RenderDuration value={item.Duration} />
                        </Space>
                    </Tooltip>
                }
            />
        </List.Item>
    );
}

function ListOfRuns(props: { runs: DetailsOfRun[] }): ReactNode {
    const details = props.runs.map(parseDetailedTestRun).reverse();
    const firstRun = details.at(0);
    const chronological = details.slice(1);

    const today = dayjs();
    const forToday = chronological.filter((run) =>
        run.Started[0].isSame(today, "date")
    );

    const yesterday = today.subtract(1, "day");
    const forYesterday = chronological.filter((run) =>
        run.Started[0].isSame(yesterday, "date")
    );

    const thisWeek = yesterday.subtract(yesterday.get("day") + 1, "days");
    const forThisWeek = chronological.filter(
        (run) =>
            run.Started[0].isAfter(thisWeek, "date") &&
            run.Started[0].isBefore(yesterday, "date")
    );

    const data = [
        { items: [firstRun], label: "Latest Run" },
        { items: forToday, label: "Today" },
        { items: forYesterday, label: "Yesterday" },
        { items: forThisWeek, label: "This Week" },
    ]
        .filter((item) => item.items.length > 0)
        .map((item) => ({
            key: item.label,
            label: item.label,
            children: (
                <List
                    bordered
                    itemLayout="vertical"
                    size="small"
                    dataSource={item.items}
                    renderItem={(item) =>
                        item != null ? <RunCard run={item} /> : <></>
                    }
                />
            ),
        }));

    return (
        <Collapse
            size="small"
            accordion
            items={data}
            defaultActiveKey={["Latest Run"]}
        />
    );
}

function ListOfCharts(props: { runs: DetailsOfRun[] }): ReactNode {
    const [isTest, showTest] = useState(true);
    const areaChart = (
        <Card
            title="Test Runs"
            bordered={true}
            size="small"
            extra={
                <Switch
                    defaultChecked
                    checkedChildren={<>Tests</>}
                    unCheckedChildren={<>Suites</>}
                    onChange={(checked) => {
                        showTest(checked);
                    }}
                    checked={isTest}
                />
            }
        >
            <AreaChartForRuns runs={props.runs} showTest={isTest} />
        </Card>
    );

    const durationChart = (
        <Card title="Duration Plot" bordered={true} size="small">
            <HistogramForDuration runs={props.runs} />
        </Card>
    );

    return (
        <Space direction="vertical" style={{ width: "100%" }}>
            {areaChart}
            {durationChart}
        </Space>
    );
}

export default function GridOfRuns(props: { runs: DetailsOfRun[] }): ReactNode {
    if (props.runs.length === 0) {
        return (
            <Layout style={{ height: "100%" }}>
                <Space
                    direction="horizontal"
                    style={{ height: "100%", justifyContent: "center" }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No Runs Found!, Please run your test suite"
                    />
                </Space>
            </Layout>
        );
    }

    const projectNames = Array.from(
        new Set(props.runs.map((run) => run.projectName))
    ).map((projectName) => ({ label: projectName, value: projectName }));

    return (
        <Layout style={{ margin: "6px" }}>
            <Layout.Header className={HeaderStyles.header} spellCheck>
                <Select
                    mode="multiple"
                    options={projectNames}
                    allowClear
                    placeholder="Select Project Name"
                    style={{ minWidth: "180px" }}
                />
            </Layout.Header>
            <Layout hasSider style={{ margin: "6px" }}>
                <Layout.Sider width={350} theme={"light"}>
                    <ListOfRuns runs={props.runs} />
                </Layout.Sider>
                <Layout.Content style={{ margin: "6px" }}>
                    <ListOfCharts runs={props.runs} />
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
