import {
    type SuiteDetails,
    type statusOfEntity,
    type TestDetails,
} from "@/types/detailedTestRunPage";
import Table from "antd/lib/table/Table";
import React, { useContext, type ReactNode, useState } from "react";
import { parseTestCaseEntity } from "../parseUtils";
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
import DirectoryTree, { DirectoryTreeProps } from "antd/lib/tree/DirectoryTree";
import Layout from "antd/lib/layout/layout";
import Sider from "antd/lib/layout/Sider";
import type { DataNode } from "antd/es/tree";
import parentEntities from "./items";
import { type specNode } from "@/types/testRun";

function treeData(node: specNode, suites: SuiteDetails): DataNode[] {
    const root: DataNode = { title: "Root", key: "", children: [] };
    const structure: DataNode[] = [root];
    const pulled = new Set(suites["@order"]);
    const nodes = [{ node, childrenSpace: root.children }];

    while (nodes.length > 0) {
        const result = nodes.pop();
        if (result?.node == null || result?.childrenSpace == null) continue;
        const { node, childrenSpace } = result;

        const current = node["<path>"];

        const childParts = new Set(Object.keys(node));
        childParts.delete("<path>");

        childParts.forEach((child) => {
            const childNode = {
                key: child,
                title: child,
                children: [],
            };
            childrenSpace.push(childNode);
            nodes.push({
                node: node[child],
                childrenSpace: childNode.children,
            });
        });

        pulled.forEach((suiteID) => {
            const suite = suites[suiteID];
            if (suite.file !== current) return;
            childrenSpace.push({
                key: suiteID,
                title: `📃 ${suite.title}`,
                isLeaf: true,
                icon: <></>,
            });
            pulled.delete(suiteID);
        });
    }

    return structure;
}

export default function ProjectStructure(): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: detailsOfTestRun } = useSWR<DetailsOfRun>(
        getTestRun(port, testID)
    );
    if (detailsOfTestRun == null || suites == null) return <></>;

    const projectStructure: DataNode[] = treeData(
        JSON.parse(detailsOfTestRun.specStructure),
        suites
    );

    return (
        <Layout>
            <Layout hasSider>
                <Sider width={400} style={{ height: "100%" }}>
                    <DirectoryTree
                        treeData={projectStructure}
                        showLine
                        selectable
                    />
                </Sider>
            </Layout>
        </Layout>
    );
}
