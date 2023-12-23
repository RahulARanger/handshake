import { CardForAImage } from 'src/components/utils/images-with-thumbnails';
import type {
    Assertion,
    AttachedError,
    PreviewForTests,
} from 'src/types/parsed-records';
import BadgeForSuiteType from 'src/components/utils/test-status-dot';
import React, { useContext, type ReactNode } from 'react';
import Convert from 'ansi-to-html';
import Text from 'antd/lib/typography/Text';
import List from 'antd/lib/list';
import Space from 'antd/lib/space';
import Alert from 'antd/lib/alert/Alert';
import PreviewGroup from 'antd/lib/image/PreviewGroup';
import {
    convertForWrittenAttachments,
    parseAttachment,
} from 'src/components/parse-utils';
import MetaCallContext from '../TestRun/context';
import useSWR from 'swr';
import {
    getEntityLevelAttachment,
    getSuites,
    getTestRun,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import Drawer from 'antd/lib/drawer/index';
import Tabs from 'antd/lib/tabs/index';
import type TestRunRecord from 'src/types/test-run-records';
import type {
    AttachmentDetails,
    SuiteDetails,
    TestDetails,
} from 'src/types/generated-response';
import Typography from 'antd/lib/typography/index';
import Breadcrumb from 'antd/lib/breadcrumb/Breadcrumb';
import { Tag } from 'antd/lib';

function ErrorMessage(properties: {
    item: AttachedError;
    converter: Convert;
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));

    if (tests == undefined || suites == undefined) return <></>;

    return (
        <List.Item
            key={properties.item.name}
            actions={[
                properties.item.mailedFrom ? (
                    <Breadcrumb
                        items={properties.item.mailedFrom
                            .toReversed()
                            .map((suite) => ({
                                key: suite,
                                title: (
                                    <Typography
                                        style={{
                                            fontStyle: 'italic',
                                            cursor:
                                                suites[suite] == undefined
                                                    ? undefined
                                                    : 'pointer',
                                        }}
                                    >
                                        {(tests[suite] ?? suites[suite]).title}
                                    </Typography>
                                ),
                                onClick: suites[suite]
                                    ? () => {
                                          properties.setTestID(
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
                                        __html: properties.converter.toHtml(
                                            properties.item.message,
                                        ),
                                    }}
                                />
                            </Text>
                        }
                        description={
                            <Text>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: properties.converter.toHtml(
                                            properties.item.stack ?? '',
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

function AssertionComponent(properties: {
    title: string;
    item: { value: string };
}): ReactNode {
    const assertValue: Assertion = JSON.parse(properties.item.value);
    return (
        <List.Item key={assertValue.matcherName}>
            <List.Item.Meta description={properties.title} />
            <Alert
                showIcon
                type={assertValue.result.pass ? 'success' : 'error'}
                message={
                    <Space>
                        <Tag>{assertValue.matcherName}</Tag>
                        <Text>{assertValue.expectedValue}</Text>
                    </Space>
                }
            />
        </List.Item>
    );
}

export const errorsTab = 'errors';
export const imagesTab = 'images';
export const assertionsTab = 'assertions';

export default function MoreDetailsOnEntity(properties: {
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
    const { data: attachments } = useSWR<AttachmentDetails>(
        getEntityLevelAttachment(port, testID),
    );
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));

    if (
        properties.selected == undefined ||
        attachmentPrefix == undefined ||
        testID == undefined ||
        tests == undefined ||
        attachments == undefined ||
        writtenAttachments == undefined ||
        run == undefined
    )
        return <></>;

    const current = properties.selected.id;
    const needed = [current];

    if (properties.selected.type === 'SUITE') {
        for (const key of Object.keys(tests))
            tests[key]?.parent === current && needed.push(key);
    }

    const converter = new Convert();
    const images = needed
        .flatMap((key) => writtenAttachments[key])
        ?.filter((item) => item?.type === 'PNG')
        ?.map(parseAttachment);

    const assertions = needed
        .flatMap((key) => attachments[key])
        ?.filter((item) => item?.type === 'ASSERT')
        ?.map(parseAttachment);

    return (
        <Drawer
            title={
                <Space align="start">
                    <BadgeForSuiteType
                        text={properties.selected.type}
                        color={
                            properties.selected.type === 'SUITE'
                                ? 'magenta'
                                : 'purple'
                        }
                    />
                    <Text>{properties.selected.Title}</Text>
                </Space>
            }
            style={{ width: '500px' }}
            styles={{ body: { padding: '15px', paddingTop: '10px' } }}
            open={properties.open}
            onClose={properties.onClose}
            mask={false}
            placement="left"
        >
            <Tabs
                animated
                type="card"
                onChange={properties.setTab}
                activeKey={properties.tab}
                tabBarStyle={{ margin: '0px', padding: '0px' }}
                items={[
                    {
                        key: assertionsTab,
                        label: 'Assertions',
                        children: (
                            <List
                                size="small"
                                bordered
                                itemLayout="vertical"
                                dataSource={assertions}
                                renderItem={(item) => (
                                    <AssertionComponent
                                        item={JSON.parse(item.attachmentValue)}
                                        title={tests[item.entity_id].title}
                                    />
                                )}
                                pagination={{ align: 'end' }}
                            />
                        ),
                    },

                    {
                        key: errorsTab,
                        label: 'Errors',
                        children: (
                            <List
                                size="small"
                                bordered
                                itemLayout="vertical"
                                dataSource={properties.selected.Errors}
                                renderItem={(item) => (
                                    <ErrorMessage
                                        setTestID={properties.setTestID}
                                        converter={converter}
                                        item={item}
                                    />
                                )}
                                pagination={{ align: 'end' }}
                            />
                        ),
                    },
                    {
                        key: imagesTab,
                        label: 'Images',
                        children: (
                            <PreviewGroup>
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
                                    pagination={{ align: 'end' }}
                                />
                            </PreviewGroup>
                        ),
                    },
                ]}
            />
        </Drawer>
    );
}
