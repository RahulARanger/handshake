import type {
    Attachment,
    SuiteRecordDetails,
} from 'src/types/test-entity-related';
import { timelineColor } from 'src/components/parse-utils';
import { RenderDuration } from 'src/components/utils/renderers';
import type { PreviewForTests } from 'src/types/parsed-records';

import React, { type ReactNode } from 'react';
import dayjs from 'dayjs';

import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import Paragraph from 'antd/lib/typography/Paragraph';
import Description, {
    type DescriptionsProps,
} from 'antd/lib/descriptions/index';
import Timeline from 'antd/lib/timeline/Timeline';
import Text from 'antd/lib/typography/Text';
import { dateTimeFormatUsed } from 'src/components/utils/Datetime/format';
import { Tag } from 'antd/lib';
import Avatar from 'antd/lib/avatar/avatar';
import RelativeTo from 'src/components/utils/Datetime/relative-time';

export function EntityCollapsibleItem(properties: {
    item: PreviewForTests;
    attachmentsForDescription?: Attachment[];
    attachmentsForLinks?: Attachment[];
}): ReactNode {
    const aboutSuite: DescriptionsProps['items'] = [
        {
            key: 'title',
            label: 'Title',
            children: <Text>{properties.item.Title}</Text>,
            span: 2,
        },
        {
            key: 'duration',
            label: 'Duration',
            children: (
                <RenderDuration
                    value={properties.item.Duration}
                    autoPlay={true}
                />
            ),
        },
        {
            key: 'started',
            label: 'Range',
            children: (
                <RelativeTo
                    dateTime={properties.item.Started[0]}
                    secondDateTime={properties.item.Ended[0]}
                    style={{
                        maxWidth: '180px',
                    }}
                    autoPlay={true}
                />
            ),
        },
    ];

    return (
        <>
            {properties.attachmentsForDescription?.map((desc, index) => (
                <Paragraph key={index}>
                    {JSON.parse(desc.attachmentValue).value}
                </Paragraph>
            ))}
            <Description
                items={aboutSuite}
                bordered
                title={properties.item.Description}
                style={{ overflowX: 'hidden' }}
                size="small"
            />
            {properties.attachmentsForLinks &&
            properties.attachmentsForLinks.length > 0 ? (
                <Space style={{ marginTop: '10px' }}>
                    Links:
                    {properties.attachmentsForLinks?.map(
                        (attachment, index) => {
                            const link = JSON.parse(attachment.attachmentValue);
                            return (
                                <Tag
                                    key={index}
                                    color="blue"
                                    icon={
                                        <Avatar
                                            size="small"
                                            src={`https://www.google.com/s2/favicons?sz=64&domain_url=${link.value}`}
                                        />
                                    }
                                >
                                    <Button
                                        type="link"
                                        key={index}
                                        href={link.value}
                                        size="small"
                                    >
                                        {link.title}
                                    </Button>
                                </Tag>
                            );
                        },
                    )}
                </Space>
            ) : (
                <></>
            )}
        </>
    );
}

export function EntityTimeline(properties: {
    rawSource: SuiteRecordDetails[];
}) {
    return (
        <Timeline
            items={properties.rawSource.map((item) => ({
                children: (
                    <Space direction="vertical">
                        <Button
                            type="text"
                            size="small"
                            style={{
                                margin: '0px',
                                padding: '0px',
                                whiteSpace: 'break-spaces',
                                wordBreak: 'break-word',
                                textAlign: 'left',
                            }}
                            onClick={() => {
                                document
                                    .querySelector(`#${item.suiteID}`)
                                    ?.scrollIntoView({
                                        behavior: 'smooth',
                                    });
                            }}
                        >
                            {item.title}
                        </Button>
                        <Text italic>
                            {dayjs(item.started).format(dateTimeFormatUsed)}
                        </Text>
                    </Space>
                ),
                color: timelineColor(item.standing),
                key: item.suiteID,
            }))}
        />
    );
}
