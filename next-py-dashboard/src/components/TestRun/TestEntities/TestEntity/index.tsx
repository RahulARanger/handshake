import {
    type SuiteDetails,
    type statusOfEntity,
    type TestDetails,
    type SessionDetails,
    type suiteType,
} from "@/types/detailedTestRunPage";
import Table from "antd/lib/table/Table";
import React, { useContext, type ReactNode, useState } from "react";
import { parseTestCaseEntity } from "@/components/parseUtils";
import dayjs, { type Dayjs } from "dayjs";
import ExpandAltOutlined from "@ant-design/icons/ExpandAltOutlined";
import Card from "antd/lib/card/Card";
import Meta from "antd/lib/card/Meta";
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
    RenderDuration,
    RenderStatus,
} from "@/components/renderers";
import RenderPassedRate from "@/components/Charts/StackedBarChart";
import MetaCallContext from "@/components/TestRun/context";
import Button from "antd/lib/button/button";
import Description, {
    type DescriptionsProps,
} from "antd/lib/descriptions/index";
import useSWR from "swr";
import Drawer from "antd/lib/drawer/index";
import type DetailsOfRun from "@/types/testRun";
import parentEntities from "./items";
import { type PreviewForTests } from "@/types/testEntityRelated";
import RelativeTo from "@/components/Datetime/relativeTime";
import Typography from "antd/lib/typography/Typography";
import BadgeForSuiteType from "./Badge";
import MoreDetailsOnEntity from "./DetailedModal";

function EntityItem(props: { item: PreviewForTests }): ReactNode {
    const aboutSuite: DescriptionsProps["items"] = [
        {
            key: "started",
            label: "Started",
            children: <RenderTimeRelativeToStart value={props.item.Started} />,
        },
        {
            key: "ended",
            label: "Ended",
            children: <RenderTimeRelativeToStart value={props.item.Ended} />,
        },
        {
            key: "duration",
            label: "Duration",
            children: <RenderDuration value={props.item.Duration} />,
        },
    ];

    // if (props.item.type === "SUITE") {
    //     aboutSuite.push({
    //         key: "rate",
    //         label: "Rate",
    //         children: <RenderPassedRate value={props.item.Rate} />,
    //     });
    // }

    return (
        <Description
            items={aboutSuite}
            bordered
            title={props.item.Description}
            style={{ overflowX: "hidden" }}
            size="small"
        />
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
        {
            key: "tests",
            label: "Count",
            children: <>{selectedSuiteDetails.tests}</>,
        },
        {
            key: "duration",
            label: "Duration",
            children: (
                <RenderDuration
                    value={dayjs.duration(selectedSuiteDetails.duration)}
                />
            ),
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
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Description
                        items={aboutSuite}
                        bordered
                        style={{ overflowX: "hidden" }}
                        size="small"
                        title={selectedSuiteDetails.description}
                    />
                    <Collapse
                        defaultActiveKey={["Latest Run"]}
                        bordered
                        size="small"
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