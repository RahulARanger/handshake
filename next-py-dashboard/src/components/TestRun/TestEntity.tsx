import {
    type SuiteDetails,
    type statusOfEntity,
    type TestDetails,
    type SessionDetails,
    type suiteType,
} from "@/types/detailedTestRunPage";
import Table from "antd/lib/table/Table";
import React, { useContext, type ReactNode, useState } from "react";
import { parseTestCaseEntity } from "../parseUtils";
import dayjs, { type Dayjs } from "dayjs";
import Badge from "antd/lib/badge/index";
import ExpandAltOutlined from "@ant-design/icons/ExpandAltOutlined";
import Card from "antd/lib/card/Card";
import Meta from "antd/lib/card/Meta";
import Modal from "antd/lib/modal/Modal";
import Space from "antd/lib/space";
import Collapse, { CollapseProps } from "antd/lib/collapse/Collapse";
import WarningFilled from "@ant-design/icons/lib/icons/WarningFilled";
import Select from "antd/lib/select/index";
import BreadCrumb from "antd/lib/breadcrumb/Breadcrumb";
import {
    getSessions,
    getSuites,
    getTestRun,
    getTests,
} from "@/Generators/helper";
import RenderTimeRelativeToStart, {
    RenderBrowserType,
    RenderStatus,
} from "@/components/renderers";
import RenderPassedRate from "../Charts/StackedBarChart";
import MetaCallContext from "../TestRun/context";
import Button from "antd/lib/button/button";
import Description, {
    type DescriptionsProps,
} from "antd/lib/descriptions/index";
import useSWR from "swr";
import Drawer from "antd/lib/drawer/index";
import type DetailsOfRun from "@/types/testRun";
import parentEntities from "./items";
import { type PreviewForTests } from "@/types/testEntityRelated";
import RelativeTo from "../Datetime/relativeTime";
import Typography from "antd/lib/typography/Typography";

export function BadgeForSuiteType(props: { suiteType: suiteType }): ReactNode {
    return (
        <Badge
            color={props.suiteType === "SUITE" ? "purple" : "magenta"}
            count={props.suiteType}
            style={{ fontWeight: "bold", color: "white" }}
        />
    );
}

function MoreDetailsOnEntity(props: {
    item?: PreviewForTests;
    open: boolean;
    onClose: () => void;
}): ReactNode {
    if (props.item == null) return <></>;
    return (
        <Modal
            title={
                <Space>
                    {props.item.Title}
                    <BadgeForSuiteType suiteType={props.item.type} />
                </Space>
            }
            open={props.open}
            onCancel={props.onClose}
            cancelText="Close"
            closeIcon={<RenderStatus value={props.item.Status} />}
            width={600}
            okButtonProps={{
                style: { display: "none" },
            }}
        >
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
        </Modal>
    );
}

function EntityItem(props: { item: PreviewForTests }): ReactNode {
    const entity = props.item;
    return (
        <Card bordered size="small">
            <Space direction="vertical">
                <Meta
                    description={
                        <RelativeTo
                            dateTime={entity.Started[0]}
                            secondDateTime={entity.Ended[1]}
                            wrt={entity.Started[1]}
                        />
                    }
                />
            </Space>
        </Card>
    );
}

export default function TestEntityDrawer(props: {
    open: boolean;
    onClose: () => void;
    testID?: string;
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: run } = useSWR<DetailsOfRun>(getTestRun(port, testID));
    const [showDetailedView, setShowDetailedView] = useState<boolean>(false);
    const [selectedSuite, setSelectedSuite] = useState<
        undefined | PreviewForTests
    >(undefined);
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID)
    );

    // const helperMethod = (toShowThisSuite: PreviewForTests): void => {
    //     setSelectedSuite(toShowThisSuite);
    //     setShowDetailedView(true);
    // };

    if (
        props.testID == null ||
        sessions == null ||
        run == null ||
        suites == null ||
        tests == null
    )
        return (
            <Drawer
                open={props.open}
                onClose={props.onClose}
                title={"Not Found"}
            ></Drawer>
        );

    const selectedSuiteDetails = suites[props.testID];
    const started = dayjs(run.started);

    const dataSource = [...Object.values(tests), ...Object.values(suites)]
        .filter((test) => test.parent === selectedSuiteDetails.suiteID)
        .map((test) => {
            const actions = [];
            const parsed = parseTestCaseEntity(test, started);

            if (test.suiteType === "SUITE") {
                actions.push(
                    <Button
                        key="drill-down"
                        icon={<ExpandAltOutlined />}
                        shape="circle"
                        size="small"
                        onClick={() => {
                            props.setTestID(test.suiteID);
                        }}
                    />
                );
            }

            if (test.standing === "FAILED") {
                actions.push(
                    <Button
                        size="small"
                        key="errors"
                        type="text"
                        icon={
                            <WarningFilled
                                style={{ fontSize: "16px", color: "firebrick" }}
                            />
                        }
                        shape="round"
                        onClick={() => {
                            setSelectedSuite(parsed);
                            setShowDetailedView(true);
                        }}
                    />
                );
            }

            return {
                key: test.suiteID,
                label: (
                    <Space align="end">
                        <RenderStatus value={test.standing} />
                        <Typography>{test.title}</Typography>
                        <BadgeForSuiteType suiteType={test.suiteType} />
                    </Space>
                ),
                children: <EntityItem item={parsed} />,
                extra: <Space>{actions}</Space>,
            };
        });

    const aboutSuite: DescriptionsProps["items"] = [
        {
            key: "started",
            label: "Started",
            children: (
                <RenderTimeRelativeToStart
                    value={[dayjs(selectedSuiteDetails.started), started]}
                />
            ),
        },
        {
            key: "ended",
            label: "Ended",
            children: (
                <RenderTimeRelativeToStart
                    value={[dayjs(selectedSuiteDetails.ended), started]}
                />
            ),
        },
        {
            key: "browserName",
            label: "Browser",
            children: (
                <RenderBrowserType
                    browserName={
                        sessions[selectedSuiteDetails.session_id].browserName
                    }
                />
            ),
        },
        {
            key: "status",
            label: "Status",
            children: <RenderStatus value={selectedSuiteDetails.standing} />,
        },
    ];

    return (
        <>
            <Drawer
                open={props.open}
                onClose={props.onClose}
                title={selectedSuiteDetails.title}
                size="large"
                footer={
                    <BreadCrumb
                        items={parentEntities(
                            suites,
                            props.testID,
                            props.setTestID
                        )}
                    />
                }
            >
                <Space direction="vertical">
                    <Description
                        items={aboutSuite}
                        bordered
                        style={{ overflowX: "hidden" }}
                    />
                    <Collapse
                        size="small"
                        defaultActiveKey={["Latest Run"]}
                        bordered
                        items={dataSource}
                    />
                </Space>
            </Drawer>
            <MoreDetailsOnEntity
                open={showDetailedView}
                onClose={() => {
                    setShowDetailedView(false);
                }}
                item={selectedSuite}
            />
        </>
    );
}
