import type {
    Attachment,
    AttachmentContent,
    ErrorRecord,
} from 'src/types/test-entity-related';
import { RenderInfo, RenderStatus } from 'src/components/utils/renderers';

import React, { type ReactNode } from 'react';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import Paragraph from 'antd/lib/typography/Paragraph';
import Descriptions from 'antd/lib/descriptions/index';
import Text from 'antd/lib/typography/Text';
import { Divider, Tag, Tooltip } from 'antd/lib';
import Avatar from 'antd/lib/avatar/avatar';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import type {
    Assertion,
    ParsedSuiteRecord,
    ParsedTestRecord,
} from 'src/types/parsed-records';
import { useContext } from 'react';
import List from 'antd/lib/list';
import Alert from 'antd/lib/alert/Alert';
import PreviewGroup from 'antd/lib/image/PreviewGroup';
import Typography from 'antd/lib/typography/index';
import Breadcrumb from 'antd/lib/breadcrumb/Breadcrumb';
import { RenderDuration } from 'src/components/utils/relative-time';
import { DetailedContext } from 'src/types/records-in-detailed';
import GalleryOfImages, {
    PlainImage,
} from 'src/components/utils/images-with-thumbnails';
import Layout, { Content, Header } from 'antd/lib/layout/layout';
import Sider from 'antd/lib/layout/Sider';
import RenderTestType from 'src/components/utils/test-status-dot';

export default function EntityItem(properties: {
    entity: ParsedSuiteRecord | ParsedTestRecord;
    links: Attachment[];
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
                <Text>{properties.entity.Title}</Text>
                {properties.entity.Desc ? (
                    <Paragraph>{properties.entity.Desc}</Paragraph>
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
                            value={properties.entity.Duration}
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
                            dateTime={properties.entity.Started[0]}
                            secondDateTime={properties.entity.Ended[0]}
                            wrt={properties.entity.Started[1]}
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
            {properties.entity.error?.message ? (
                <Alert
                    type="error"
                    message={
                        <div
                            dangerouslySetInnerHTML={{
                                __html: properties.entity.error.message,
                            }}
                        />
                    }
                    showIcon
                    style={{ whiteSpace: 'pretty', wordWrap: 'break-word' }}
                    action={
                        <Tooltip
                            title={`Found ${
                                properties.entity.numberOfErrors ?? 1
                            } errors...`}
                            color="red"
                        >
                            <Button type="dashed" color="red">
                                {properties.entity.numberOfErrors ?? 1}
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
    item: ErrorRecord;
    setTestID: (testID: string) => void;
}): ReactNode {
    const context = useContext(DetailedContext);
    if (context == undefined) return <></>;
    const { suites, tests } = context;
    return (
        <List.Item
            key={properties.item.mailedFrom.at(-1)}
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
                                        {(tests[suite] ?? suites[suite]).Title}
                                    </Typography>
                                ),
                                onClick: suites[suite]
                                    ? () => {
                                          properties.setTestID(
                                              suites[suite].Id,
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
                                        __html: properties.item.message,
                                    }}
                                />
                            </Text>
                        }
                        description={
                            <Text>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: properties.item.stack,
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

function SelectedSuiteOrTest(properties: {
    selected: ParsedSuiteRecord | ParsedTestRecord;
}): ReactNode {
    return (
        <Space>
            <RenderTestType value={properties.selected.type} />
            <RenderStatus value={properties.selected.Status} />
            <Text>{properties.selected.Title}</Text>
        </Space>
    );
}

export function ListOfErrors(properties: {
    errors: ErrorRecord[];
    setTestID: (_: string) => void;
}) {
    return (
        <List
            size="small"
            bordered
            itemLayout="vertical"
            dataSource={properties.errors}
            renderItem={(item) => (
                <ErrorMessage setTestID={properties.setTestID} item={item} />
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

export function ListOfImages(properties: { entityID: string }) {
    const context = useContext(DetailedContext);
    if (context == undefined) return <></>;

    const { tests, images, suites } = context;
    const relevant = images.filter(
        (image) =>
            tests[image.entity_id].Parent == properties.entityID ||
            image.entity_id === properties.entityID,
    );

    return (
        <Layout style={{ overflowY: 'scroll', height: '100%' }}>
            <Sider
                theme="light"
                width={150}
                style={{
                    overflowY: 'scroll',
                    height: '100%',
                }}
            >
                <List
                    bordered
                    size="small"
                    dataSource={relevant}
                    style={{ overflowY: 'scroll' }}
                    itemLayout="vertical"
                    pagination={{ align: 'start' }}
                    renderItem={(image, index) => {
                        return (
                            <PlainImage
                                url={image.path}
                                key={index}
                                title={image.title}
                                maxHeight={'50px'}
                                isPlain={true}
                            />
                        );
                    }}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        backgroundColor: 'transparent',
                        height: '40px',
                        padding: '0px',
                        lineHeight: '0px',
                        paddingTop: '6px',
                        paddingLeft: '9px',
                    }}
                >
                    <SelectedSuiteOrTest
                        selected={suites[properties.entityID]}
                    />
                </Header>
                <Content style={{ marginLeft: '6px', height: '100%' }}>
                    {relevant.length > 0 ? (
                        <GalleryOfImages loop={true} height={'600px'}>
                            {relevant.map((image, index) => (
                                <PlainImage
                                    url={image.path}
                                    key={index}
                                    title={image.title}
                                    isPlain={false}
                                />
                            ))}
                        </GalleryOfImages>
                    ) : (
                        <></>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
}

export const errorsTab = 'errors';
export const imagesTab = 'images';
export const assertionsTab = 'assertions';
export const descriptionTab = 'description';
