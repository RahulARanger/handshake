import {
    type SuiteDetails,
    type statusOfEntity,
    type SuiteRecordDetails,
} from "@/types/detailedTestRunPage";
import Table from "antd/lib/table/Table";
import React, { useContext, type ReactNode } from "react";
import {
    type PreviewForDetailedEntities,
    parseDetailedTestEntity,
} from "../parseUtils";
import { type Dayjs } from "dayjs";
import Typography from "antd/lib/typography/Typography";
import Switch from "antd/lib/switch";
import RelativeTime from "../Datetime/relativeTime";
import ExpandAltOutlined from "@ant-design/icons/ExpandAltOutlined";
import Button from "antd/lib/button/button";
import { getSuites } from "@/Generators/helper";
import RenderTimeRelativeToStart, { RenderStatus } from "./renderers";
import RenderPassedRate from "../Charts/StackedBarChart";
import MetaCallContext from "../TestRun/context";
import useSWR from "swr";

interface SuiteNode extends PreviewForDetailedEntities {
    children: undefined | SuiteNode[];
    key: string;
}

function extractSuiteTree(
    suites: SuiteDetails,
    parent: string,
    startDate: Dayjs
): undefined | SuiteNode[] {
    const result = suites["@order"]
        .filter((suiteID) => parent === suites[suiteID].parent)
        .map((suiteID) => ({
            children: extractSuiteTree(suites, suiteID, startDate),
            key: suiteID,
            ...parseDetailedTestEntity(suites[suiteID], startDate),
        }));
    return result.length > 0 ? result : undefined;
}

export default function TestEntities(props: { startDate: Dayjs }): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    if (suites == null) return <></>;

    const data = extractSuiteTree(suites, "", props.startDate);

    return (
        <Table
            dataSource={data}
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
                title="Tests"
                align="center"
                dataIndex="Tests"
                width={25}
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
            <Table.Column
                dataIndex=""
                title="Open"
                width={50}
                render={() => (
                    <Button icon={<ExpandAltOutlined />} shape="circle" />
                )}
            />
        </Table>
    );
}
