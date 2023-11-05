import { CardForAImage } from 'src/components/utils/ImagesWithThumbnails';
import type { PreviewForTests } from 'src/types/parsedRecords';
import BadgeForSuiteType from 'src/components/utils/Badge';
import React, { useContext, type ReactNode } from 'react';
import Convert from 'ansi-to-html';
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
import Tabs from 'antd/lib/tabs/index';
import type TestRunRecord from 'src/types/testRunRecords';
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
    const images = writtenAttachments[props.selected.id]
        ?.filter((item) => item.type === 'PNG')
        ?.map(parseAttachment);

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
            <Tabs
                animated
                type="card"
                tabBarStyle={{ margin: '0px', padding: '0px' }}
                items={[
                    {
                        key: 'errors',
                        label: 'Errors',
                        children: (
                            <List
                                size="small"
                                bordered
                                itemLayout="vertical"
                                dataSource={props.selected.Errors}
                                renderItem={(item) => (
                                    <List.Item title="e">
                                        <ErrorMessage
                                            converter={converter}
                                            item={item}
                                        />
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                    {
                        key: 'images',
                        label: 'Images',
                        children: (
                            <List
                                size="small"
                                itemLayout="vertical"
                                dataSource={images}
                                renderItem={(image, index) => (
                                    <List.Item>
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
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                ]}
            />
        </Drawer>
    );
}
