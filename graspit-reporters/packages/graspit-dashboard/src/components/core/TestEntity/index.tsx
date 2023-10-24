import type { SuiteDetails, SessionDetails } from 'src/types/generatedResponse';
import type { statusOfEntity } from 'src/types/sessionRecords';
import type { AttachmentDetails } from 'src/types/generatedResponse';
import type { TestDetails } from 'src/types/generatedResponse';
import type { Attachment } from 'src/types/testEntityRelated';
import { parseTestCaseEntity } from 'src/components/parseUtils';
import type TestRunRecord from 'src/types/testRunRecords';
import {
    getEntityLevelAttachment,
    getSessions,
    getTestRun,
    getSuites,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import BadgeForSuiteType from 'src/components/utils/Badge';
import RenderTimeRelativeToStart, {
    RenderEntityType,
    RenderStatus,
    RenderDuration,
} from 'src/components/utils/renderers';
import MetaCallContext from '../TestRun/context';
import type { Tag as SuiteTag } from 'src/types/testEntityRelated';
import type { PreviewForTests } from 'src/types/parsedRecords';
import MoreDetailsOnEntity from './DetailedModal';
import parentEntities from './items';

import Input from 'antd/lib/input/Input';
import React, {
    useContext,
    type ReactNode,
    useState,
    type ChangeEvent,
} from 'react';
import dayjs from 'dayjs';

import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import PaperClipOutlined from '@ant-design/icons/PaperClipOutlined';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import WarningFilled from '@ant-design/icons/lib/icons/WarningFilled';
import Select, { type SelectProps } from 'antd/lib/select/index';
import BreadCrumb from 'antd/lib/breadcrumb/Breadcrumb';
import Tag from 'antd/lib/tag/index';
import Button from 'antd/lib/button/button';
import Paragraph from 'antd/lib/typography/Paragraph';
import Empty from 'antd/lib/empty/index';
import Description, {
    type DescriptionsProps,
} from 'antd/lib/descriptions/index';
import useSWR from 'swr';
import Drawer from 'antd/lib/drawer/index';
import Typography from 'antd/lib/typography/Typography';
import { StaticPercent } from 'src/components/utils/counter';

function EntityItem(props: {
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

export default function TestEntityDrawer(props: {
    open: boolean;
    onClose: () => void;
    testID?: string;
    setTestID: (testID: string) => void;
}): ReactNode {
    const { port, testID } = useContext(MetaCallContext);

    const { data: run } = useSWR<TestRunRecord>(getTestRun(port, testID));

    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const { data: tests } = useSWR<TestDetails>(getTests(port, testID));
    const { data: sessions } = useSWR<SessionDetails>(
        getSessions(port, testID),
    );
    const { data: attachments } = useSWR<AttachmentDetails>(
        getEntityLevelAttachment(port, testID),
    );
    const { data: writtenAttachments } = useSWR<AttachmentDetails>(
        getWrittenAttachments(port, testID),
    );

    const [showDetailedView, setShowDetailedView] = useState<boolean>(false);
    const [selectedSuite, setSelectedSuite] = useState<
        undefined | PreviewForTests
    >(undefined);
    const [filterStatus, setFilterStatus] = useState<null | statusOfEntity>(
        null,
    );
    const [filterText, setFilterText] = useState<null | string>(null);

    if (
        props.testID == null ||
        sessions == null ||
        run == null ||
        suites == null ||
        tests == null ||
        attachments == null ||
        writtenAttachments == null
    )
        return (
            <Drawer
                open={props.open}
                onClose={props.onClose}
                title={'Not Found'}
            ></Drawer>
        );

    const selectedSuiteDetails = suites[props.testID];
    const started = dayjs(run.started);

    const dataSource = [...Object.values(tests), ...Object.values(suites)]
        .filter((test) => {
            let result = test.parent === selectedSuiteDetails.suiteID;
            result &&= filterStatus == null || test.standing === filterStatus;
            result &&= filterText == null || test.title.includes(filterText);
            return result;
        })
        .map((test) => {
            const actions = [];
            const parsed = parseTestCaseEntity(test, started);
            const openDetailedView = (): void => {
                setSelectedSuite(parsed);
                setShowDetailedView(true);
            };

            const hasRequiredAttachment = writtenAttachments[
                test.suiteID
            ]?.find((attachment) => attachment.type === 'PNG');

            if (test.suiteType === 'SUITE') {
                actions.push(
                    <Button
                        key="drill-down"
                        icon={<ExpandAltOutlined />}
                        shape="circle"
                        size="small"
                        onClick={() => {
                            props.setTestID(test.suiteID);
                        }}
                    />,
                );
            } else {
                if (hasRequiredAttachment != null) {
                    actions.push(
                        <Button
                            key="attachments"
                            shape="circle"
                            size="small"
                            icon={<PaperClipOutlined />}
                            onClick={openDetailedView}
                        />,
                    );
                }
            }

            if (test.standing === 'FAILED') {
                actions.push(
                    <Button
                        size="small"
                        key="errors"
                        type="text"
                        icon={
                            <WarningFilled
                                style={{ fontSize: '16px', color: 'firebrick' }}
                            />
                        }
                        shape="round"
                        onClick={openDetailedView}
                    />,
                );
            }

            return {
                key: test.suiteID,
                label: (
                    <Space align="end">
                        <RenderStatus value={test.standing} />
                        <Typography>{test.title}</Typography>
                        <BadgeForSuiteType
                            text={test.suiteType}
                            color={
                                test.suiteType === 'SUITE'
                                    ? 'magenta'
                                    : 'purple'
                            }
                        />
                    </Space>
                ),
                children: (
                    <EntityItem
                        item={parsed}
                        attachmentsForDescription={attachments[
                            parsed.id
                        ]?.filter((item) => item.type === 'DESC')}
                    />
                ),
                extra: <Space>{actions}</Space>,
            };
        });

    const aboutSuite: DescriptionsProps['items'] = [
        {
            key: 'started',
            label: 'Started',
            children: (
                <RenderTimeRelativeToStart
                    value={[dayjs(selectedSuiteDetails.started), started]}
                />
            ),
        },
        {
            key: 'ended',
            label: 'Ended',
            children: (
                <RenderTimeRelativeToStart
                    value={[dayjs(selectedSuiteDetails.ended), started]}
                />
            ),
        },
        {
            key: 'duration',
            label: 'Duration',
            children: (
                <RenderDuration
                    value={dayjs.duration(selectedSuiteDetails.duration)}
                />
            ),
        },
        {
            key: 'browserName',
            label: 'Browser',
            children: (
                <RenderEntityType
                    entityName={
                        sessions[selectedSuiteDetails.session_id].entityName
                    }
                />
            ),
        },
        {
            key: 'status',
            label: 'Status',
            children: <RenderStatus value={selectedSuiteDetails.standing} />,
        },
        {
            key: 'tests',
            label: 'Contribution',
            children: (
                <StaticPercent
                    percent={
                        (selectedSuiteDetails.tests /
                            Object.keys(tests).length) *
                        100
                    }
                />
            ),
        },
    ];

    const statusOptions: SelectProps['options'] = [
        'Passed',
        'Failed',
        'Skipped',
    ].map((status) => ({
        label: (
            <Space>
                {status}
                <RenderStatus value={status.toUpperCase()} />
            </Space>
        ),
        value: status.toUpperCase(),
    }));

    const tags = JSON.parse(selectedSuiteDetails.tags).map((tag: SuiteTag) => {
        return (
            <Tag key={tag.astNodeId} color="orange">
                {tag.name}
            </Tag>
        );
    });

    return (
        <>
            <Drawer
                open={props.open}
                onClose={props.onClose}
                title={selectedSuiteDetails.title}
                size="large"
                footer={
                    <BreadCrumb
                        items={parentEntities(
                            suites,
                            props.testID,
                            props.setTestID,
                        )}
                    />
                }
                extra={
                    <Space>
                        <Input
                            placeholder="Search"
                            allowClear
                            onChange={(
                                event: ChangeEvent<HTMLInputElement>,
                            ) => {
                                const value = event.target.value;
                                setFilterText(value === '' ? null : value);
                            }}
                        />
                        <Select
                            options={statusOptions}
                            placeholder="Select Status"
                            allowClear
                            value={filterStatus}
                            onChange={(value) => {
                                setFilterStatus(value);
                            }}
                        />
                    </Space>
                }
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Description
                        items={aboutSuite}
                        bordered
                        style={{ overflowX: 'hidden' }}
                        size="small"
                        title={
                            selectedSuiteDetails.description == null ||
                            tags.length > 0 ? (
                                <>
                                    {tags.length === 0 ? (
                                        <>{selectedSuiteDetails.description} </>
                                    ) : (
                                        <Space direction="vertical">
                                            {selectedSuiteDetails.description}
                                            <Space direction="horizontal">
                                                {tags}
                                            </Space>
                                        </Space>
                                    )}
                                </>
                            ) : undefined
                        }
                    />

                    {dataSource.length > 0 ? (
                        <Collapse
                            defaultActiveKey={['Latest Run']}
                            bordered
                            size="small"
                            items={dataSource}
                        />
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No Test Entities were found"
                        />
                    )}
                </Space>
            </Drawer>
            <MoreDetailsOnEntity
                open={showDetailedView}
                onClose={() => {
                    setShowDetailedView(false);
                }}
                item={selectedSuite}
                items={attachments[selectedSuite?.id ?? '']}
                writtenItems={writtenAttachments[selectedSuite?.id ?? '']}
            />
        </>
    );
}
