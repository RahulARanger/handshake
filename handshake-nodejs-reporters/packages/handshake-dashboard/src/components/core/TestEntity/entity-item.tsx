import type { ErrorRecord } from 'src/types/test-entity-related';
import { RenderInfo } from 'src/components/utils/renderers';

import React, { useRef, useState, type ReactNode } from 'react';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import Paragraph from 'antd/lib/typography/Paragraph';
// import Descriptions from 'antd/lib/descriptions/index';
import Text from 'antd/lib/typography/Text';
import { Divider, Tooltip } from 'antd/lib';
// import Avatar from 'antd/lib/avatar/avatar';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import type {
    ParsedSuiteRecord,
    ParsedTestRecord,
} from 'src/types/parsed-records';
import { useContext } from 'react';
import List from 'antd/lib/list';
import Alert from 'antd/lib/alert/Alert';
import Typography from 'antd/lib/typography/index';
import Breadcrumb from 'antd/lib/breadcrumb/Breadcrumb';
import { RenderDuration } from 'src/components/utils/relative-time';
import { DetailedContext } from 'src/types/records-in-detailed';
import { PlainImage } from 'src/components/utils/images-with-thumbnails';
import Layout from 'antd/lib/layout/layout';
import Sider from 'antd/lib/layout/Sider';
import Ribbon from 'antd/lib/badge/Ribbon';
import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import type { UseEmblaCarouselType } from 'embla-carousel-react';

export default function EntityItem(properties: {
    entity: ParsedSuiteRecord | ParsedTestRecord;
    // links: Attachment[];
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
            {/* {properties.links?.length > 0 ? (
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
            )} */}
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

export function ListOfErrors(properties: {
    errors: ErrorRecord[];
    setTestID: (_: string) => void;
}) {
    return (
        <Layout>
            <List
                size="small"
                bordered
                itemLayout="vertical"
                dataSource={properties.errors}
                renderItem={(item) => (
                    <ErrorMessage
                        setTestID={properties.setTestID}
                        item={item}
                    />
                )}
                pagination={{ align: 'end' }}
            />
        </Layout>
    );
}

// export function ListOfAssertions(properties: {
//     assertions: Attachment[];
// }): ReactNode {
//     return (
//         <List
//             size="small"
//             bordered
//             itemLayout="vertical"
//             dataSource={properties.assertions}
//             renderItem={(item, index) => (
//                 <AssertionComponent
//                     attached={JSON.parse(item.attachmentValue)}
//                     key={index}
//                     // title={tests[item.entity_id].title}
//                 />
//             )}
//             pagination={
//                 properties.assertions.length > 0
//                     ? { align: 'end', size: 'small' }
//                     : undefined
//             }
//         />
//     );
// }

const imageIndex = (key: number) => `image-${key}`;

export function ListOfImages(properties: { entityID: string }) {
    const context = useContext(DetailedContext);
    const thumbnail = useRef<UseEmblaCarouselType[1] | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [currentSlide, setCurrentSlide] = useState<number>(0);
    if (context == undefined) return <></>;

    const pageSize = 10;

    const { tests, images, suites } = context;
    const relevant = images.filter(
        (image) =>
            tests[image.entity_id].Parent == properties.entityID ||
            image.entity_id === properties.entityID,
    );

    return (
        <Layout
            hasSider
            style={{
                height: '100%',
                margin: '.5px',
                border: '1px solid red',
                overflowY: 'clip',
            }}
        >
            <Sider
                theme="light"
                width={180}
                style={{
                    margin: '6px',
                    height: '100%',
                    overflowY: 'clip',
                    border: '1px solid red',
                }}
            >
                <List
                    bordered
                    size="small"
                    dataSource={relevant}
                    itemLayout="vertical"
                    style={{ overflow: 'auto' }}
                    pagination={{
                        align: 'start',
                        size: 'small',
                        responsive: true,
                        current: currentPage,
                        onChange(page) {
                            setCurrentPage(page);
                        },
                    }}
                    renderItem={(image, index) => {
                        return (
                            <List.Item
                                style={{ margin: '2px', padding: '3px' }}
                            >
                                <Ribbon
                                    text={
                                        currentSlide ===
                                        (currentPage - 1) * pageSize + index
                                            ? '➡️'
                                            : ''
                                    }
                                    placement="start"
                                    color="transparent"
                                >
                                    <Ribbon
                                        color="transparent"
                                        text={
                                            <Button
                                                size="small"
                                                shape="circle"
                                                icon={
                                                    <ExpandAltOutlined
                                                        size={4}
                                                        color={'orangered'}
                                                    />
                                                }
                                                onClick={() => {
                                                    if (thumbnail.current) {
                                                        thumbnail.current.scrollTo(
                                                            (currentPage - 1) *
                                                                pageSize +
                                                                index,
                                                            false,
                                                        );
                                                    }
                                                }}
                                            />
                                        }
                                        placement="end"
                                        style={{
                                            right: '5px',
                                        }}
                                    >
                                        <PlainImage
                                            url={image.path}
                                            key={index}
                                            title={image.title}
                                            maxHeight={'200px'}
                                            isPlain={true}
                                            id={imageIndex(index)}
                                        />
                                    </Ribbon>
                                </Ribbon>
                            </List.Item>
                        );
                    }}
                />
            </Sider>
        </Layout>
    );
}

export const errorsTab = 'errors';
export const imagesTab = 'images';
export const assertionsTab = 'assertions';
export const descriptionTab = 'description';
