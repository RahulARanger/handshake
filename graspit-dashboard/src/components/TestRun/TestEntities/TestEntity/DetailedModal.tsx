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
import Badge from "antd/lib/badge/index";
import ExpandAltOutlined from "@ant-design/icons/ExpandAltOutlined";
import Card, { type CardProps } from "antd/lib/card/Card";
import Meta from "antd/lib/card/Meta";
import List from "antd/lib/list";
import Modal from "antd/lib/modal/Modal";
import Space from "antd/lib/space";
import { RenderStatus } from "@/components/renderers";
import { type PreviewForTests } from "@/types/testEntityRelated";
import BadgeForSuiteType from "./Badge";
import Alert from "antd/lib/alert/Alert";
import Convert from "ansi-to-html";

function ErrorMessage(props: { item: Error; converter: Convert }): ReactNode {
    return (
        <Alert
            message={
                <div
                    dangerouslySetInnerHTML={{
                        __html: props.converter.toHtml(props.item.message),
                    }}
                />
            }
            showIcon
            type="error"
            description={
                <div
                    dangerouslySetInnerHTML={{
                        __html: props.converter.toHtml(props.item.stack ?? ""),
                    }}
                />
            }
        />
    );
}

export default function MoreDetailsOnEntity(props: {
    item?: PreviewForTests;
    open: boolean;
    onClose: () => void;
}): ReactNode {
    if (props.item == null) return <></>;
    const converter = new Convert();

    const tabList: CardProps["tabList"] = [];

    if (props.item.Errors != null) {
        tabList.push({
            key: "errors",
            label: "Errors",
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={props.item.Errors}
                    renderItem={(item) => (
                        <List.Item>
                            <ErrorMessage converter={converter} item={item} />
                        </List.Item>
                    )}
                />
            ),
        });
    }

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
            <Card tabList={tabList} size="small" bordered />
        </Modal>
    );
}
