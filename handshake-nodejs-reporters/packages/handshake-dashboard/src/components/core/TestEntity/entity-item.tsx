import type { ErrorRecord } from 'src/types/test-entity-related';
import { RenderInfo, RenderStatus } from 'src/components/utils/renderers';

import React, { useRef, useState, type ReactNode } from 'react';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import Paragraph from 'antd/lib/typography/Paragraph';
// import Descriptions from 'antd/lib/descriptions/index';
import Text from 'antd/lib/typography/Text';
import type { CollapseProps } from 'antd/lib';
import { Collapse, Divider, Tag, Tooltip } from 'antd/lib';
// import Avatar from 'antd/lib/avatar/avatar';
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
import type { Dayjs } from 'dayjs';
import { DurationLayer } from './header';

export default function EntityItem(properties: {
    entity: ParsedSuiteRecord | ParsedTestRecord;
    setTestID: (_: string) => void;
    testStartedAt: Dayjs;
    // links: Attachment[];
}) {
    const items: CollapseProps['items'] = [];

    properties.entity.errors.length > 0 &&
        items.push({
            key: 'errors',
            label: 'Errors',
            children: (
                <ListOfErrors
                    errors={properties.entity.errors}
                    setTestID={properties.setTestID}
                    ghost
                />
            ),
        });

    return (
        <Space
            direction="vertical"
            style={{
                width: '100%',
            }}
        >
            <DurationLayer
                selected={properties.entity}
                wrt={properties.testStartedAt}
                offsetTop={5}
            />
            <Space
                direction="vertical"
                style={{
                    paddingLeft: '20px',
                    top: -10,
                    position: 'relative',
                }}
                size="small"
            >
                <Text>{properties.entity.Title}</Text>
                {properties.entity.Desc ? (
                    <Paragraph type="secondary">
                        {properties.entity.Desc}
                    </Paragraph>
                ) : (
                    <></>
                )}
                {properties.entity.Status != 'SKIPPED' &&
                properties.entity.errors.length === 0 ? (
                    <Tag color="green">No Errors Found</Tag>
                ) : (
                    <></>
                )}
            </Space>
            <Collapse bordered items={items} ghost />
        </Space>
    );
}

export function ListOfErrors(properties: {
    errors: ErrorRecord[];
    ghost?: boolean;
    setTestID?: (_: string) => void;
}) {
    const context = useContext(DetailedContext);
    if (context == undefined) return <></>;
    const { tests, suites } = context;

    return (
        <Collapse
            size="small"
            ghost={properties.ghost}
            expandIconPosition="right"
            style={{ backgroundColor: 'transparent' }}
            items={properties.errors.map((error, index) => ({
                key: error?.mailedFrom?.at(-1) ?? index,
                showArrow: false,
                label: (
                    <Alert
                        type="error"
                        message={
                            <Text style={{ fontSize: '0.8rem' }}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: error.message,
                                    }}
                                />
                            </Text>
                        }
                    />
                ),
                children: (
                    <Alert
                        type="error"
                        message={
                            <Space direction="vertical">
                                <Paragraph>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: error.stack,
                                        }}
                                    />
                                </Paragraph>
                                {error.mailedFrom &&
                                error.mailedFrom?.length > 0 ? (
                                    <Breadcrumb
                                        items={error.mailedFrom
                                            .toReversed()
                                            .map((suite) => ({
                                                key: suite,
                                                title: (
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {
                                                            (
                                                                tests[suite] ??
                                                                suites[suite]
                                                            ).Title
                                                        }
                                                    </Text>
                                                ),
                                                onClick: suites[suite]
                                                    ? () => {
                                                          properties.setTestID &&
                                                              properties.setTestID(
                                                                  suites[suite]
                                                                      .Id ??
                                                                      suites[
                                                                          tests[
                                                                              suite
                                                                          ]
                                                                              .Parent
                                                                      ].Id,
                                                              );
                                                      }
                                                    : undefined,
                                            }))}
                                    />
                                ) : (
                                    <></>
                                )}
                            </Space>
                        }
                    />
                ),
                style: { backgroundColor: 'transparent' },
            }))}
        />
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
