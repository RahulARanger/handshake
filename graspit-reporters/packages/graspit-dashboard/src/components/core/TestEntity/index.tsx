import type { SuiteDetails, SessionDetails } from 'src/types/generatedResponse';
import type { statusOfEntity } from 'src/types/sessionRecords';
import type { AttachmentDetails } from 'src/types/generatedResponse';
import type { TestDetails } from 'src/types/generatedResponse';
import {
    optionsForEntities,
    parseTestCaseEntity,
} from 'src/components/parseUtils';
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
import MoreDetailsOnEntity, { errorsTab, imagesTab } from './DetailedModal';

import Input from 'antd/lib/input/Input';
import React, {
    useContext,
    type ReactNode,
    useState,
    type ChangeEvent,
    useMemo,
} from 'react';
import dayjs from 'dayjs';

import ExpandAltOutlined from '@ant-design/icons/ExpandAltOutlined';
import PaperClipOutlined from '@ant-design/icons/PaperClipOutlined';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import WarningFilled from '@ant-design/icons/lib/icons/WarningFilled';
import Select, { type SelectProps } from 'antd/lib/select/index';
import Button from 'antd/lib/button/button';
import Empty from 'antd/lib/empty/index';
import Description, {
    type DescriptionsProps,
} from 'antd/lib/descriptions/index';
import useSWR from 'swr';
import Drawer from 'antd/lib/drawer/index';
import Typography from 'antd/lib/typography/Typography';
import Counter, { StaticPercent } from 'src/components/utils/counter';
import CheckboxGroup from 'antd/lib/checkbox/Group';
import Divider from 'antd/lib/divider/index';
import Card from 'antd/lib/card/Card';
import Badge from 'antd/lib/badge/index';
import Meta from 'antd/lib/card/Meta';
import TreeSelectionOfSuites, { NavigationButtons } from './header';
import { EntityCollapsibleItem, EntityTimeline } from './entityItem';

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
    const [detailed, setDetailed] = useState<undefined | string>(props.testID);
    const [filterStatus, setFilterStatus] = useState<null | statusOfEntity>(
        null,
    );
    const [filterText, setFilterText] = useState<null | string>(null);
    const [choices, setChoices] = useState<string[]>([]);
    const [tabForDetailed, setTabForDetailed] = useState<string>(imagesTab);
    const [showTimeline] = useMemo<boolean[]>(
        () => [choices.includes(optionsForEntities[0])],
        [choices],
    );

    if (
        props.testID == null ||
        sessions == null ||
        run == null ||
        suites == null ||
        tests == null ||
        attachments == null ||
        writtenAttachments == null
    )
        return <></>;

    const selectedSuiteDetails = suites[props.testID];
    const started = dayjs(run.started);

    const closeTimeline = () =>
        setChoices(choices.filter((x) => x != optionsForEntities[0]));
    const setTestID = (detailed: string) => {
        setDetailed(detailed);
        props.setTestID(detailed);
    };

    const rawSource = [
        ...Object.values(tests),
        ...Object.values(suites),
    ].filter((test) => {
        let result = test.parent === selectedSuiteDetails.suiteID;
        result &&= filterStatus == null || test.standing === filterStatus;
        result &&= filterText == null || test.title.includes(filterText);
        return result;
    });

    const dataSource = rawSource.map((test) => {
        const actions = [];
        const parsed = parseTestCaseEntity(test, started);
        const openDetailedView = (tab: string): void => {
            setShowDetailedView(true);
            setDetailed(parsed.id);
            setTabForDetailed(tab);
        };

        const hasRequiredAttachment = writtenAttachments[test.suiteID]?.find(
            (attachment) => attachment.type === 'PNG',
        );

        if (test.suiteType === 'SUITE') {
            actions.push(
                <Button
                    key="drill-down"
                    icon={<ExpandAltOutlined />}
                    shape="circle"
                    size="small"
                    onClick={() => {
                        setTestID(test.suiteID);
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
                        onClick={openDetailedView.bind(null, imagesTab)}
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
                    onClick={openDetailedView.bind(null, errorsTab)}
                />,
            );
        }

        return {
            key: test.suiteID,
            label: (
                <Space align="end" id={test.suiteID}>
                    <RenderStatus value={test.standing} />
                    <Typography>{test.title}</Typography>
                    <BadgeForSuiteType
                        text={test.suiteType}
                        color={
                            test.suiteType === 'SUITE' ? 'magenta' : 'purple'
                        }
                    />
                </Space>
            ),
            children: (
                <EntityCollapsibleItem
                    item={parsed}
                    attachmentsForDescription={attachments[parsed.id]?.filter(
                        (item) => item.type === 'DESC',
                    )}
                    attachmentsForLinks={attachments[parsed.id]?.filter(
                        (item) => item.type === 'LINK',
                    )}
                />
            ),
            extra: <Space>{actions}</Space>,
        };
    });

    const tags = JSON.parse(selectedSuiteDetails.tags).map((tag: SuiteTag) => {
        return (
            <Badge
                key={tag.astNodeId}
                color="geekblue"
                count={tag.name}
                style={{ color: 'white' }}
            />
        );
    });

    const aboutSuite: DescriptionsProps['items'] = [
        {
            key: 'started',
            label: 'Started',
            children: (
                <RenderTimeRelativeToStart
                    value={[dayjs(selectedSuiteDetails.started), started]}
                    style={{ minWidth: '120px' }}
                />
            ),
        },
        {
            key: 'ended',
            label: 'Ended',
            children: (
                <RenderTimeRelativeToStart
                    value={[dayjs(selectedSuiteDetails.ended), started]}
                    style={{ minWidth: '120px' }}
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
            key: 'tests',
            label: 'Contribution',
            children: (
                <StaticPercent
                    percent={
                        ((selectedSuiteDetails.rollup_tests ??
                            selectedSuiteDetails.tests) /
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

    return (
        <>
            <Drawer
                open={props.open}
                onClose={() => {
                    props.onClose();
                    setShowDetailedView(false);
                    closeTimeline();
                }}
                footer={
                    tags.length > 0 ? (
                        <Space>
                            <>Tags:</>
                            {tags}
                        </Space>
                    ) : undefined
                }
                title={
                    <Space style={{ marginBottom: '-5px' }} align="start">
                        <TreeSelectionOfSuites
                            selected={props.testID}
                            setTestID={setTestID}
                        />
                    </Space>
                }
                size="large"
                extra={
                    <NavigationButtons
                        selectedSuite={selectedSuiteDetails}
                        setTestID={setTestID}
                    />
                }
                styles={{ body: { padding: '15px', paddingTop: '10px' } }}
            >
                <Space
                    direction="vertical"
                    style={{ width: '100%', marginTop: '-3px' }}
                >
                    <Card
                        size="small"
                        bordered
                        title={selectedSuiteDetails.file}
                    >
                        <Space style={{ columnGap: '10px' }}>
                            <CheckboxGroup
                                options={optionsForEntities}
                                value={choices}
                                onChange={(checked) => {
                                    setChoices(
                                        checked.map((checked) =>
                                            checked.toString(),
                                        ),
                                    );
                                }}
                            />
                            <Divider type="vertical" />
                            <Input
                                placeholder="Search"
                                allowClear
                                size="small"
                                onChange={(
                                    event: ChangeEvent<HTMLInputElement>,
                                ) => {
                                    const value = event.target.value;
                                    setFilterText(value === '' ? null : value);
                                }}
                                suffix={
                                    <Counter
                                        style={{ fontStyle: 'italic' }}
                                        end={dataSource.length}
                                        prefix="("
                                        suffix=")"
                                    />
                                }
                            />
                            <Select
                                options={statusOptions}
                                placeholder="Select Status"
                                size="small"
                                allowClear
                                value={filterStatus}
                                onChange={(value) => {
                                    setFilterStatus(value);
                                }}
                            />
                            <Button
                                key="attachments"
                                shape="circle"
                                size="small"
                                icon={<PaperClipOutlined />}
                                onClick={() => [
                                    setDetailed(props.testID),
                                    setShowDetailedView(true),
                                ]}
                            />
                        </Space>
                        {selectedSuiteDetails.description ? (
                            <Meta
                                style={{ marginTop: '12px' }}
                                description={selectedSuiteDetails.description}
                            />
                        ) : (
                            <></>
                        )}
                    </Card>

                    <Description
                        items={aboutSuite}
                        bordered
                        style={{ overflowX: 'hidden' }}
                        size="small"
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
                <Drawer
                    open={showTimeline}
                    onClose={closeTimeline}
                    title="Timeline"
                    mask={false}
                >
                    <EntityTimeline rawSource={rawSource} />
                </Drawer>
            </Drawer>
            <MoreDetailsOnEntity
                open={showDetailedView}
                onClose={() => {
                    setShowDetailedView(false);
                }}
                tab={tabForDetailed}
                setTestID={setTestID}
                selected={
                    detailed
                        ? parseTestCaseEntity(
                              suites[detailed] ?? tests[detailed],
                              started,
                          )
                        : undefined
                }
                setTab={setTabForDetailed}
            />
        </>
    );
}
