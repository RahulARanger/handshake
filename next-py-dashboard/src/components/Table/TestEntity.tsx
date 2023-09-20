import {
    type SuiteDetails,
    type statusOfEntity,
    type TestDetails,
} from "@/types/detailedTestRunPage";
import Table from "antd/lib/table/Table";
import React, { useContext, type ReactNode, useState } from "react";
import {
    type PreviewForDetailedEntities,
    parseDetailedTestEntity,
} from "../parseUtils";
import dayjs, { type Dayjs } from "dayjs";
import ExpandAltOutlined from "@ant-design/icons/ExpandAltOutlined";
import Button from "antd/lib/button/button";
import Select from "antd/lib/select/index";
import BreadCrumb from "antd/lib/breadcrumb/Breadcrumb";
import { getSuites, getTestRun, getTests } from "@/Generators/helper";
import RenderTimeRelativeToStart, { RenderStatus } from "./renderers";
import RenderPassedRate from "../Charts/StackedBarChart";
import MetaCallContext from "../TestRun/context";
import useSWR from "swr";
import Drawer from "antd/lib/drawer/index";
import type DetailsOfRun from "@/types/testRun";
import Space from "antd/lib/space";
import parentEntities from "./items";

export default function TestEntityDrawer(props: {
    open: boolean;
    onClose: () => void;
    testID?: string;
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: run } = useSWR<DetailsOfRun>(getTestRun(port, testID));
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));

    if (props.testID == null || run == null || suites == null || tests == null)
        return (
            <Drawer
                open={props.open}
                onClose={props.onClose}
                title={"Not Found"}
            ></Drawer>
        );

    const selectedSuiteDetails = suites[props.testID];

    const started = dayjs(run.started);
    const dataSource = Object.values(tests)
        .filter((test) => test.parent === selectedSuiteDetails.suiteID)
        .map((test) => parseDetailedTestEntity(test, started));

    const childSuites = Object.values(suites)
        .filter((suite) => suite.parent === selectedSuiteDetails.suiteID)
        .map((suite) => ({ label: suite.title, value: suite.suiteID }));

    const options = [
        {
            label: "Parent",
            options: [
                {
                    label: selectedSuiteDetails.title,
                    value: selectedSuiteDetails.suiteID,
                },
            ],
        },
        {
            label: "Child Suites",
            options: childSuites,
        },
    ];

    return (
        <Drawer
            open={props.open}
            onClose={props.onClose}
            title={selectedSuiteDetails.title}
            size="large"
            footer={
                <Space
                    style={{ justifyContent: "space-between", width: "100%" }}
                >
                    <BreadCrumb
                        items={parentEntities(
                            suites,
                            props.testID,
                            props.setTestID
                        )}
                    />
                    <Select
                        options={options}
                        placeholder="Select Child Suite"
                        value={selectedSuiteDetails.suiteID}
                        onChange={(value) => {
                            props.setTestID(value);
                        }}
                    />
                </Space>
            }
        >
            <Table
                dataSource={dataSource}
                size="small"
                bordered
                scroll={{ x: "max-content" }}
            >
                <Table.Column
                    title="Status"
                    width={40}
                    align="center"
                    dataIndex="Status"
                    render={(value: statusOfEntity) => (
                        <RenderStatus value={value} />
                    )}
                    fixed="left"
                />
                <Table.Column title="Name" dataIndex="Title" width={120} />
                <Table.Column
                    title="Rate"
                    dataIndex="Rate"
                    width={120}
                    render={(value: [number, number, number]) => (
                        <RenderPassedRate value={value} />
                    )}
                />
                <Table.Column
                    dataIndex="Started"
                    title="Started"
                    width={100}
                    render={(value: [Dayjs, Dayjs]) => (
                        <RenderTimeRelativeToStart value={value} />
                    )}
                />
                <Table.Column
                    title="Ended"
                    width={100}
                    dataIndex="Ended"
                    render={(value: [Dayjs, Dayjs]) => (
                        <RenderTimeRelativeToStart value={value} />
                    )}
                />
                <Table.Column
                    title="Description"
                    width={100}
                    dataIndex="Description"
                />
                <Table.Column dataIndex="File" title="File" width={100} />
            </Table>
        </Drawer>
    );
}
