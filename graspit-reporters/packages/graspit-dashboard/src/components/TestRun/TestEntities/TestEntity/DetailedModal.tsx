import React, { type ReactNode } from "react";
import Card, { type CardProps } from "antd/lib/card/Card";
import List from "antd/lib/list";
import Modal from "antd/lib/modal/Modal";
import Space from "antd/lib/space";
import { RenderStatus } from "@/components/renderers";
import { type PreviewForTests } from "@/types/testEntityRelated";
import BadgeForSuiteType from "./Badge";
import Alert from "antd/lib/alert/Alert";
import Convert from "ansi-to-html";
import { type Attachment } from "@/types/detailedTestRunPage";
import ImagesWithThumbnail from "./ImagesWithThumbnails";

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
    items: Attachment[];
    onClose: () => void;
}): ReactNode {
    if (props.item == null) return <></>;
    const converter = new Convert();

    const tabList: CardProps["tabList"] = [];

    if (props.item.Errors?.length > 0) {
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

    const images = props.items?.filter((item) => item.type === "PNG");
    if (images?.length > 0) {
        tabList.push({
            key: "images",
            label: "Images",
            children: <ImagesWithThumbnail images={images} />,
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
            destroyOnClose
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
