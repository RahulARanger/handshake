import {
    gridViewMode,
    type SessionDetails,
    type SuiteDetails,
    type statusOfEntity,
    treeViewMode,
} from "@/types/detailedTestRunPage";
import Table from "antd/lib/table/Table";
import React, { useContext, type ReactNode, useState } from "react";
import { parseDetailedTestEntity } from "../parseUtils";
import { type Dayjs } from "dayjs";
import ExpandAltOutlined from "@ant-design/icons/ExpandAltOutlined";
import Button from "antd/lib/button/button";
import { getSessions, getSuites } from "@/Generators/helper";
import RenderTimeRelativeToStart, {
    RenderBrowserType,
    RenderStatus,
} from "@/components/renderers";
import TableOutlined from "@ant-design/icons/TableOutlined";
import PartitionOutlined from "@ant-design/icons/PartitionOutlined";
import RenderPassedRate from "../Charts/StackedBarChart";
import MetaCallContext from "../TestRun/context";
import useSWR from "swr";
import TestEntityDrawer from "./TestEntity";
import {
    type possibleBrowserNames,
    type PreviewForDetailedEntities,
} from "@/types/testEntityRelated";
import Segmented, {
    type SegmentedLabeledOption,
} from "antd/lib/segmented/index";
import Space from "antd/lib/space/index";
import ProjectStructure from "./Structure";
interface SuiteNode extends PreviewForDetailedEntities {
    children: undefined | SuiteNode[];
    key: string;
}

function extractSuiteTree(
    suites: SuiteDetails,
    parent: string,
    startDate: Dayjs,
    sessions: SessionDetails
): undefined | SuiteNode[] {
    const result = suites["@order"]
        .filter((suiteID) => parent === suites[suiteID].parent)
        .map((suiteID) => ({
            children: extractSuiteTree(suites, suiteID, startDate, sessions),
            key: suiteID,
            ...parseDetailedTestEntity(
                suites[suiteID],
                startDate,
                sessions[suites[suiteID].session_id]
            ),
        }));
    return result.length > 0 ? result : undefined;
}

export default function TestEntities(props: {
    startDate: Dayjs;
    setIcon: (viewMode: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID)
    );
    const [showEntity, setShowEntity] = useState<boolean>(false);
    const [toShowTestID, setTestID] = useState<string>();
    const [viewMode, setViewMode] = useState<number | string>(gridViewMode);

    const onClose = (): void => {
        setShowEntity(false);
    };

    if (suites == null || sessions == null) return <></>;

    const data = extractSuiteTree(suites, "", props.startDate, sessions);
    const options: SegmentedLabeledOption[] = [
        {
            label: "Grid",
            value: gridViewMode,
            icon: <TableOutlined />,
        },
        {
            label: "Tree",
            value: treeViewMode,
            icon: <PartitionOutlined />,
        },
    ];

    const helperToSetTestID = (testID: string): void => {
        setTestID(testID);
        setShowEntity(true);
    };

    return (
        <>
            <Space direction="vertical" style={{ width: "100%" }}>
                <Segmented
                    options={options}
                    defaultValue={viewMode}
                    onChange={(value) => {
                        const selected = value.toString();
                        setViewMode(selected);
                        props.setIcon(selected);
                    }}
                    style={{ marginBottom: "10px" }}
                />
                {viewMode === gridViewMode ? (
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
                        <Table.Column
                            title="Name"
                            dataIndex="Title"
                            width={120}
                        />
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
                            title="Browser"
                            width={100}
                            dataIndex="browserName"
                            align="center"
                            render={(value: possibleBrowserNames) => (
                                <RenderBrowserType browserName={value} />
                            )}
                        />
                        <Table.Column
                            dataIndex="File"
                            title="File"
                            width={100}
                        />
                        <Table.Column
                            dataIndex=""
                            title="Open"
                            width={50}
                            render={(_, record: SuiteNode) => (
                                <Button
                                    icon={<ExpandAltOutlined />}
                                    shape="circle"
                                    onClick={() => {
                                        setTestID(record.id);
                                        setShowEntity(true);
                                    }}
                                />
                            )}
                        />
                    </Table>
                ) : (
                    <ProjectStructure setTestID={helperToSetTestID} />
                )}
            </Space>
            <TestEntityDrawer
                open={showEntity}
                onClose={onClose}
                testID={toShowTestID}
                setTestID={helperToSetTestID}
            />
        </>
    );
}
