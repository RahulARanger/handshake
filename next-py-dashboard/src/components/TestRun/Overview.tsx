import type DetailsOfRun from "@/types/testRun";
import React, { useState, type ReactNode, useContext } from "react";
import Space from "antd/lib/space";
import Card from "antd/lib/card/Card";
import Counter from "./counter";
import ProgressPieChart from "../Charts/StatusPieChart";
import Typography from "antd/lib/typography/Typography";
import Switch from "antd/lib/switch";
import RelativeTime from "../Datetime/relativeTime";
import dayjs, { type Dayjs } from "dayjs";
import Table from "antd/lib/table/Table";
import MetaCallContext from "./context";
import { getSuites } from "@/Generators/helper";
import Button from "antd/lib/button/button";
import useSWR from "swr";
import {
    type SuiteRecordDetails,
    type statusOfEntity,
    type SuiteDetails,
} from "@/types/detailedTestRunPage";
import { RenderStatus } from "../Table/renderers";
import RenderPassedRate from "../Charts/StackedBarChart";
import CarouselComponent from "../carousel";

function TopSuites(props: { startedAt: Dayjs }): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data } = useSWR<SuiteDetails>(getSuites(port, testID));
    if (data == null) return <></>;
    const dateTimeFormat = "HH:mm A DD-MM-YYYY";

    const top5Suites = data["@order"]
        .slice(-5, data?.["@order"].length)
        .map((suite) => data[suite]);

    return (
        <Table
            dataSource={top5Suites}
            size="small"
            bordered
            pagination={false}
            style={{ flexShrink: 1, minWidth: "300px" }}
            scroll={{ y: 180, x: "max-content" }}
            footer={() => (
                <Space>
                    <Typography>{`Showing ${top5Suites.length} Recent Suites, `}</Typography>
                    <Typography>
                        Click&nbsp;
                        <Button type="link" style={{ padding: "0px" }}>
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
                render={(value: string) => dayjs(value).format(dateTimeFormat)}
            />
            <Table.Column
                title="Ended"
                width={120}
                dataIndex="ended"
                render={(value: string) => dayjs(value).format(dateTimeFormat)}
            />
        </Table>
    );
}

export default function Overview(props: { run: DetailsOfRun }): ReactNode {
    const [isTest, setTest] = useState<boolean>(true);
    const startedAt = dayjs(props.run.started);
    const total = isTest
        ? props.run.tests
        : JSON.parse(props.run.suiteSummary).count;

    return (
        <Space direction="vertical">
            <Space>
                <Card
                    bordered
                    style={{ minHeight: "268px" }}
                    title={
                        <Space align="center">
                            <Typography>Executed</Typography>
                            <Counter end={total} />
                            <Typography>
                                <Switch
                                    key={"switch"}
                                    defaultChecked
                                    size="small"
                                    checkedChildren={<>Test Cases</>}
                                    unCheckedChildren={<>Test Suites</>}
                                    onChange={(checked) => {
                                        setTest(checked);
                                    }}
                                    checked={isTest}
                                    style={{
                                        marginBottom: "2px",
                                        marginRight: "5px",
                                    }}
                                />
                            </Typography>
                        </Space>
                    }
                    extra={
                        <RelativeTime
                            dateTime={startedAt}
                            style={{ marginLeft: "30px", maxWidth: "110px" }}
                        />
                    }
                    size="small"
                >
                    <ProgressPieChart run={props.run} isTestCases={isTest} />
                </Card>
                <TopSuites startedAt={startedAt} />
            </Space>
            <Space>
                <Card size="small" bordered>
                    <CarouselComponent />
                </Card>
            </Space>
        </Space>
    );
}
