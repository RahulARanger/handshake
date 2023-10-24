import { RenderStatus } from 'src/components/utils/renderers';
import type { Attachment } from 'src/types/testEntityRelated';
import GalleryOfImages, {
    CardForAImage,
} from 'src/components/utils/ImagesWithThumbnails';
import type { PreviewForTests } from 'src/types/parsedRecords';
import BadgeForSuiteType from 'src/components/utils/Badge';

import React, { useContext, type ReactNode } from 'react';
import Convert from 'ansi-to-html';
import Card, { type CardProps } from 'antd/lib/card/Card';

import List from 'antd/lib/list';
import Modal from 'antd/lib/modal/Modal';
import Space from 'antd/lib/space';
import Alert from 'antd/lib/alert/Alert';
import {
    convertForWrittenAttachments,
    parseAttachment,
} from 'src/components/parseUtils';
import MetaCallContext from '../TestRun/context';
import useSWR from 'swr';
import { getTestRun } from 'src/components/scripts/helper';
import type TestRunRecord from 'src/types/testRunRecords';

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
                        __html: props.converter.toHtml(props.item.stack ?? ''),
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
    writtenItems: Attachment[];
    onClose: () => void;
}): ReactNode {
    const { port, testID, attachmentPrefix } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));

    if (
        attachmentPrefix == null ||
        testID == null ||
        run == null ||
        props.item == null
    )
        return <></>;
    const converter = new Convert();

    const tabList: CardProps['tabList'] = [];

    if (props.item.Errors?.length > 0) {
        tabList.push({
            key: 'errors',
            label: 'Errors',
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

    const images = props.writtenItems
        ?.filter((item) => item.type === 'PNG')
        .map(parseAttachment);

    if (images?.length > 0) {
        tabList.push({
            key: 'images',
            label: 'Images',
            children: (
                <GalleryOfImages loop={false}>
                    {images.map((image, index) => (
                        <CardForAImage
                            index={index}
                            key={index}
                            title={image.parsed.title}
                            maxHeight={'250px'}
                            url={convertForWrittenAttachments(
                                attachmentPrefix,
                                testID,
                                image.parsed.value,
                            )}
                            desc={image.description}
                        />
                    ))}
                </GalleryOfImages>
            ),
        });
    }

    return (
        <Modal
            title={
                <Space>
                    {props.item.Title}
                    <BadgeForSuiteType
                        text={props.item.type}
                        color={
                            props.item.type === 'SUITE' ? 'magenta' : 'purple'
                        }
                    />
                </Space>
            }
            open={props.open}
            onCancel={props.onClose}
            destroyOnClose
            cancelText="Close"
            closeIcon={<RenderStatus value={props.item.Status} />}
            width={600}
            okButtonProps={{
                style: { display: 'none' },
            }}
        >
            <Card tabList={tabList} size="small" bordered />
        </Modal>
    );
}
