import type {
    Attachment,
    AttachmentContent,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import { RenderInfo } from 'src/components/utils/renderers';

import React, { type ReactNode } from 'react';
import dayjs from 'dayjs';

import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import Paragraph from 'antd/lib/typography/Paragraph';
import Descriptions, {
    type DescriptionsProps,
} from 'antd/lib/descriptions/index';
import Text from 'antd/lib/typography/Text';
import { Divider, Tag, Tooltip } from 'antd/lib';
import Avatar from 'antd/lib/avatar/avatar';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import { CardForAImage } from 'src/components/utils/images-with-thumbnails';
import type { Assertion, AttachedError } from 'src/types/parsed-records';
import RenderTestType from 'src/components/utils/test-status-dot';
import { useContext } from 'react';
import type Convert from 'ansi-to-html';
import List from 'antd/lib/list';
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
import { RenderDuration } from 'src/components/utils/relative-time';

export default function EntityItem(properties: {
    entity: SuiteRecordDetails;
    started: dayjs.Dayjs;
    links: Attachment[];
    firstError?: string;
    totalErrors?: number;
}) {
    return (
        <Space
            direction="vertical"
            split={
                <Divider
                    style={{
                        padding: 0,
                        margin: 0,
                        marginTop: '3px',
                    }}
                />
            }
            style={{ width: '100%' }}
        >
            <Space direction="vertical">
                <Text>{properties.entity.title}</Text>
                {properties.entity.description ? (
                    <Paragraph>{properties.entity.description}</Paragraph>
                ) : (
                    <></>
                )}
            </Space>

            <Space>
                <RenderInfo
                    itemKey="Duration"
                    color="purple"
                    value={
                        <RenderDuration
                            value={dayjs.duration({
                                milliseconds: properties.entity.duration,
                            })}
                            style={{ fontStyle: 'italic' }}
                            autoPlay
                        />
                    }
                />
                <RenderInfo
                    itemKey="Range"
                    color="cyan"
                    value={
                        <RelativeTo
                            dateTime={dayjs(properties.entity.started)}
                            secondDateTime={dayjs(properties.entity.ended)}
                            wrt={properties.started}
                            autoPlay
                        />
                    }
                />
            </Space>
            {properties.links?.length > 0 ? (
                <Space wrap>
                    {properties.links?.map((link) => {
                        const value: AttachmentContent = JSON.parse(
                            link.attachmentValue,
                        );
                        return (
                            <Tag
                                key={link.entity_id}
                                icon={
                                    <Avatar
                                        size="small"
                                        style={{ padding: '3px' }}
                                        src={`http://www.google.com/s2/favicons?domain=${value.value}`}
                                    />
                                }
                            >
                                <Button href={value.value} type="link">
                                    {value.title}
                                </Button>
                            </Tag>
                        );
                    })}
                </Space>
            ) : (
                <></>
            )}
            {properties.firstError ? (
                <Alert
                    type="error"
                    message={properties.firstError}
                    showIcon
                    style={{ whiteSpace: 'pretty', wordWrap: 'break-word' }}
                    action={
                        <Tooltip
                            title={`Found ${
                                properties.totalErrors ?? 1
                            } errors...`}
                            color="red"
                        >
                            <Button type="dashed" color="red">
                                {properties.totalErrors ?? 1}
                            </Button>
                        </Tooltip>
                    }
                />
            ) : (
                <></>
            )}
        </Space>
    );
}

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
    attached: AttachmentContent;
}): ReactNode {
    const assertValue: Assertion = JSON.parse(properties.attached.value);
    return (
        <List.Item>
            <Alert
                showIcon
                type={assertValue.result?.pass ? 'success' : 'error'}
                message={
                    <Space
                        style={{ width: '100%' }}
                        styles={{ item: { width: '100%' } }}
                    >
                        <Descriptions
                            bordered
                            size="small"
                            column={2}
                            style={{ width: '100%' }}
                            items={[
                                {
                                    key: 'name',
                                    label: 'Name',
                                    children: (
                                        <Text ellipsis={{ tooltip: true }}>
                                            {assertValue.matcherName}
                                        </Text>
                                    ),
                                },
                                {
                                    key: 'expected',
                                    label: 'Expected',
                                    children: (
                                        <Text>{assertValue.expectedValue}</Text>
                                    ),
                                },
                                {
                                    key: 'options',
                                    label: 'Options',
                                    children: (
                                        <Text>
                                            {JSON.stringify(
                                                assertValue.options,
                                            )}
                                        </Text>
                                    ),
                                },
                            ]}
                        />
                    </Space>
                }
            />
        </List.Item>
    );
}

export function ListOfErrors(properties: { errors: AttachedError[] }) {
    return (
        <List
            size="small"
            bordered
            itemLayout="vertical"
            dataSource={properties.errors}
            renderItem={(item) => (
                <ErrorMessage
                    setTestID={properties.setTestID}
                    converter={converter}
                    item={item}
                />
            )}
            pagination={{ align: 'end' }}
        />
    );
}

export function ListOfAssertions(properties: {
    assertions: Attachment[];
}): ReactNode {
    return (
        <List
            size="small"
            bordered
            itemLayout="vertical"
            dataSource={properties.assertions}
            renderItem={(item, index) => (
                <AssertionComponent
                    attached={JSON.parse(item.attachmentValue)}
                    key={index}
                    // title={tests[item.entity_id].title}
                />
            )}
            pagination={
                properties.assertions.length > 0
                    ? { align: 'end', size: 'small' }
                    : undefined
            }
        />
    );
}

export const errorsTab = 'errors';
export const imagesTab = 'images';
export const assertionsTab = 'assertions';
export const descriptionTab = 'description';
