import { CardForAImage } from 'src/components/utils/ImagesWithThumbnails';
import type { AttachedError, PreviewForTests } from 'src/types/parsedRecords';
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
    getSuites,
    getTestRun,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import Drawer from 'antd/lib/drawer/index';
import Tabs from 'antd/lib/tabs/index';
import type TestRunRecord from 'src/types/testRunRecords';
import type {
    AttachmentDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generatedResponse';
import { Breadcrumb, Typography } from 'antd/lib';

function ErrorMessage(props: {
    item: AttachedError;
    converter: Convert;
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));

    if (tests == null || suites == null) return <></>;

    return (
        <List.Item
            key={props.item.name}
            actions={[
                props.item.mailedFrom ? (
                    <Breadcrumb
                        items={props.item.mailedFrom
                            .toReversed()
                            .map((suite) => ({
                                key: suite,
                                title: (
                                    <Typography
                                        style={{
                                            cursor:
                                                suites[suite] == null
                                                    ? undefined
                                                    : 'pointer',
                                        }}
                                    >
                                        {(tests[suite] ?? suites[suite]).title}
                                    </Typography>
                                ),
                                onClick: suites[suite]
                                    ? () => {
                                          props.setTestID(
                                              suites[suite].suiteID,
                                          );
                                      }
                                    : undefined,
                            }))}
                    />
                ) : (
                    <></>
                ),
            ]}
        >
            <List.Item.Meta
                description={
                    <Alert
                        type="error"
                        message={
                            <Text>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: props.converter.toHtml(
                                            props.item.message,
                                        ),
                                    }}
                                />
                            </Text>
                        }
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
                }
            />
        </List.Item>
    );
}
export const errorsTab = 'errors';
export const imagesTab = 'images';

export default function MoreDetailsOnEntity(props: {
    selected?: PreviewForTests;
    open: boolean;
    setTestID: (required: string) => void;
    onClose: () => void;
    setTab: (tab: string) => void;
    tab: string;
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
                onChange={props.setTab}
                activeKey={props.tab}
                tabBarStyle={{ margin: '0px', padding: '0px' }}
                items={[
                    {
                        key: errorsTab,
                        label: 'Errors',
                        children: (
                            <List
                                size="small"
                                bordered
                                itemLayout="vertical"
                                dataSource={props.selected.Errors}
                                renderItem={(item) => (
                                    <ErrorMessage
                                        setTestID={props.setTestID}
                                        converter={converter}
                                        item={item}
                                    />
                                )}
                            />
                        ),
                    },
                    {
                        key: imagesTab,
                        label: 'Images',
                        children: (
                            <List
                                size="small"
                                bordered
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