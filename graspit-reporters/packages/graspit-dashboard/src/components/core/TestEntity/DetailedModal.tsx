import { CardForAImage } from 'src/components/utils/ImagesWithThumbnails';
import type { PreviewForTests } from 'src/types/parsedRecords';
import BadgeForSuiteType from 'src/components/utils/Badge';

import React, { useContext, type ReactNode } from 'react';
import Convert from 'ansi-to-html';
import Card, { type CardProps } from 'antd/lib/card/Card';
import Text from 'antd/lib/typography/Text';
import List from 'antd/lib/list';
import Space from 'antd/lib/space';
import Alert from 'antd/lib/alert/Alert';
import {
    convertForWrittenAttachments,
    parseAttachment,
} from 'src/components/parseUtils';
import MetaCallContext from '../TestRun/context';
import useSWR from 'swr';
import {
    getTestRun,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import Drawer from 'antd/lib/drawer/index';
import type TestRunRecord from 'src/types/testRunRecords';
import Empty from 'antd/lib/empty/index';
import type { AttachmentDetails } from 'src/types/generatedResponse';

function ErrorMessage(props: { item: Error; converter: Convert }): ReactNode {
    return (
        <Alert
            message={
                <Text>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: props.converter.toHtml(props.item.message),
                        }}
                    />
                </Text>
            }
            showIcon
            type="error"
            description={
                <Text>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: props.converter.toHtml(
                                props.item.stack ?? '',
                            ),
                        }}
                    />
                </Text>
            }
        />
    );
}

export default function MoreDetailsOnEntity(props: {
    selected?: PreviewForTests;
    open: boolean;
    onClose: () => void;
}): ReactNode {
    const { port, testID, attachmentPrefix } = useContext(MetaCallContext);
    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));
    const { data: writtenAttachments } = useSWR<AttachmentDetails>(
        getWrittenAttachments(port, testID),
    );

    if (
        props.selected == null ||
        attachmentPrefix == null ||
        testID == null ||
        writtenAttachments == null ||
        run == null
    )
        return <></>;

    const converter = new Convert();
    const tabList: CardProps['tabList'] = [];

    if (props.selected.Errors?.length > 0) {
        tabList.push({
            key: 'errors',
            label: 'Errors',
            children: (
                <List
                    itemLayout="vertical"
                    dataSource={props.selected.Errors}
                    renderItem={(item) => (
                        <List.Item>
                            <ErrorMessage converter={converter} item={item} />
                        </List.Item>
                    )}
                />
            ),
        });
    }

    const images = writtenAttachments[props.selected.id]
        ?.filter((item) => item.type === 'PNG')
        ?.map(parseAttachment);

    if (images?.length > 0) {
        tabList.push({
            key: 'images',
            label: 'Images',
            children: (
                <>
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
                </>
            ),
        });
    }

    return (
        <Drawer
            title={
                <Space align="start">
                    <BadgeForSuiteType
                        size="small"
                        text={props.selected.type}
                        color={
                            props.selected.type === 'SUITE'
                                ? 'magenta'
                                : 'purple'
                        }
                    />
                    <Text>{props.selected.Title}</Text>
                </Space>
            }
            style={{ width: '500px' }}
            styles={{ body: { padding: '15px', paddingTop: '10px' } }}
            open={props.open}
            onClose={props.onClose}
            mask={false}
            placement="left"
        >
            {tabList.length > 0 ? (
                <Card tabList={tabList} size="small" bordered />
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No Attachments were added for this."
                />
            )}
        </Drawer>
    );
}
