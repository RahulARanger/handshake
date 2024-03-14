import type { Assertion, ErrorRecord } from 'types/test-entity-related';
import React from 'react';
import Space from 'antd/lib/space';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import type { CollapseProps } from 'antd/lib';
import { Collapse, Tag, Tooltip } from 'antd/lib';
import type { ParsedSuiteRecord, ParsedTestRecord } from 'types/parsed-records';
import { useContext } from 'react';
import Alert from 'antd/lib/alert/Alert';
import Breadcrumb from 'antd/lib/breadcrumb/Breadcrumb';
import { DetailedContext } from 'types/records-in-detailed';
import GalleryOfImages, { PlainImage } from 'components/images-with-thumbnails';
import type { Dayjs } from 'dayjs';
import { DurationLayer } from './header';
import Counter from 'components/charts/counter';

export default function EntityItem(properties: {
    entity: ParsedSuiteRecord | ParsedTestRecord;
    setTestID: (_: string) => void;
    testStartedAt: Dayjs;
}) {
    const items: CollapseProps['items'] = [];

    properties.entity.errors.length > 0 &&
        items.push({
            key: 'errors',
            label: 'Errors',
            extra: (
                <Tooltip title="Total Errors" color="red">
                    <Counter end={properties.entity.errors.length} />
                </Tooltip>
            ),
            children: (
                <GroupedErrors
                    errors={properties.entity.errors}
                    setTestID={properties.setTestID}
                    ghost
                />
            ),
        });

    const forTestEntity = properties.entity as ParsedTestRecord;

    forTestEntity.Images?.length > 0 &&
        items.push({
            key: 'images',
            label: 'Images',
            extra: (
                <Tooltip title="Total Images" color="orange">
                    <Counter end={forTestEntity.Images.length} />
                </Tooltip>
            ),
            children: (
                <GalleryOfImages pics={2} dragFree noLoop>
                    {forTestEntity.Images.map((image) => (
                        <PlainImage
                            url={image.path}
                            title={image.title}
                            key={image.entity_id}
                            desc={image.description}
                            height={'250px'}
                        />
                    ))}
                </GalleryOfImages>
            ),
        });

    forTestEntity.Assertions?.length > 0 &&
        items.push({
            key: 'assertions',
            label: 'Assertions',
            extra: (
                <Tooltip title="Total Assertions" color="orange">
                    <Counter end={forTestEntity.Assertions.length} />
                </Tooltip>
            ),
            children: (
                <GroupedAssertions
                    assertions={forTestEntity.Assertions}
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

export function GroupedErrors(properties: {
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
            items={properties.errors.map((error, index) => ({
                key: error?.mailedFrom?.at(-1) ?? index,
                // showArrow: false,
                label: (
                    <Alert
                        type="error"
                        message={
                            <Text
                                style={{
                                    fontSize: '0.8rem',
                                }}
                            >
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
            }))}
        />
    );
}

function GroupedAssertions(properties: {
    assertions: Assertion[];
    ghost?: boolean;
}) {
    return (
        <Collapse
            size="small"
            ghost={properties.ghost}
            expandIconPosition="right"
            items={properties.assertions.map((assertion, index) => ({
                key: index,
                // showArrow: false,
                label: <Text>{assertion.title}</Text>,
                extra: (
                    <Tag color={assertion.passed ? 'green' : 'red'}>
                        {assertion.passed ? 'PASS' : 'FAIL'}
                    </Tag>
                ),
                children: (
                    <Space direction="vertical">
                        <Alert
                            type={assertion.passed ? 'success' : 'error'}
                            message={
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: assertion.message ?? '',
                                    }}
                                />
                            }
                        />
                        <Space>
                            {assertion.wait > 0 ? (
                                <Tag color="geekblue">{`Waited for ${assertion.wait} ms`}</Tag>
                            ) : (
                                <></>
                            )}
                            {assertion.interval > 0 ? (
                                <Tag color="cyan">{`at an Interval ${assertion.interval} ms`}</Tag>
                            ) : (
                                <></>
                            )}
                        </Space>
                    </Space>
                ),
            }))}
        />
    );
}
