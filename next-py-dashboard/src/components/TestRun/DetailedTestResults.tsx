import React, { useContext, type ReactNode } from "react";
import { getTestRun } from "@/Generators/helper";
import type DetailsOfRun from "@/types/testRun";
import useSWR from "swr";
import Layout from "antd/lib/layout/index";
import HeaderStyles from "@/styles/header.module.css";
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

    const items: Tab[] = [
        {
            label: "Overview",
            children: <Overview run={data} />,
            key: "overview",
        },
    ];

    return (
        <Layout style={{ overflow: "hidden", height: "98vh" }}>
            <Layout.Header
                className={HeaderStyles.header}
                spellCheck
                style={{ padding: "6px" }}
            >
                <Space
                    align="baseline"
                    size="large"
                    style={{
                        width: "100%",
                        justifyContent: "space-between",
                        marginTop: "2px",
                    }}
                >
                    <BreadCrumb items={crumbsForRun(data.projectName)} />
                    <Space>
                        <RelativeTime dateTime={dayjs(data.ended)} />
                    </Space>
                </Space>
            </Layout.Header>
            <Layout.Content
                style={{
                    margin: "12px",
                    marginTop: "2px",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <Tabs items={items} size="small" />
            </Layout.Content>
        </Layout>
    );
}
