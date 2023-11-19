import type {
    Attachment,
    SuiteRecordDetails,
} from 'src/types/testEntityRelated';
import { timelineColor } from 'src/components/parseUtils';
import RenderTimeRelativeToStart, {
    RenderDuration,
} from 'src/components/utils/renderers';
import type { PreviewForTests } from 'src/types/parsedRecords';

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

export function EntityCollapsibleItem(props: {
    item: PreviewForTests;
    attachmentsForDescription?: Attachment[];
}): ReactNode {
    const aboutSuite: DescriptionsProps['items'] = [
        {
            key: 'started',
            label: 'Started',
            children: <RenderTimeRelativeToStart value={props.item.Started} />,
        },
        {
            key: 'ended',
            label: 'Ended',
            children: <RenderTimeRelativeToStart value={props.item.Ended} />,
        },
        {
            key: 'duration',
            label: 'Duration',
            children: <RenderDuration value={props.item.Duration} />,
        },
    ];

    return (
        <>
            {props.attachmentsForDescription?.map((desc, index) => (
                <Paragraph key={index}>
                    {JSON.parse(desc.attachmentValue).value}
                </Paragraph>
            ))}
            <Description
                items={aboutSuite}
                bordered
                title={props.item.Description}
                style={{ overflowX: 'hidden' }}
                size="small"
            />
        </>
    );
}

export function EntityTimeline(props: { rawSource: SuiteRecordDetails[] }) {
    return (
        <Timeline
            items={props.rawSource.map((item) => ({
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
                                    .getElementById(item.suiteID)
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
