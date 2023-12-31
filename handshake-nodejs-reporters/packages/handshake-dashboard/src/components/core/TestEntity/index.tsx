import type {
    SuiteDetails,
    SessionDetails,
} from 'src/types/generated-response';
import type { statusOfEntity } from 'src/types/session-records';
import type { AttachmentDetails } from 'src/types/generated-response';
import type { TestDetails } from 'src/types/generated-response';
import {
    optionsForEntities,
    parseTestCaseEntity,
} from 'src/components/parse-utils';
import type TestRunRecord from 'src/types/test-run-records';
import {
    getEntityLevelAttachment,
    getSessions,
    getTestRun,
    getSuites,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import BadgeForSuiteType from 'src/components/utils/test-status-dot';
import {
    RenderEntityType,
    RenderStatus,
    RenderDuration,
} from 'src/components/utils/renderers';
import MetaCallContext from '../TestRun/context';
import type { Tag as SuiteTag } from 'src/types/test-entity-related';
import MoreDetailsOnEntity, { errorsTab, imagesTab } from './detailed-modal';

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
import Text from 'antd/lib/typography/Text';
import Counter, { StaticPercent } from 'src/components/utils/counter';
import CheckboxGroup from 'antd/lib/checkbox/Group';
import Divider from 'antd/lib/divider/index';
import Card from 'antd/lib/card/Card';
import Badge from 'antd/lib/badge/index';
import Meta from 'antd/lib/card/Meta';
import TreeSelectionOfSuites, { NavigationButtons } from './header';
import { EntityCollapsibleItem, EntityTimeline } from './entity-item';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import CheckableTag from 'antd/lib/tag/CheckableTag';

export default function TestEntityDrawer(properties: {
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
    const [detailed, setDetailed] = useState<undefined | string>(
        properties.testID,
    );
    const [filterStatus, setFilterStatus] = useState<
        undefined | statusOfEntity
    >();
    const [filterText, setFilterText] = useState<undefined | string>();
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [choices, setChoices] = useState<string[]>([]);
    const [tabForDetailed, setTabForDetailed] = useState<string>(imagesTab);
    const [showTimeline] = useMemo<boolean[]>(
        () => [choices.includes(optionsForEntities[0])],
        [choices],
    );
    if (
        properties.testID == undefined ||
        sessions == undefined ||
        run == undefined ||
        suites == undefined ||
        tests == undefined ||
        attachments == undefined ||
        writtenAttachments == undefined
    )
        return <></>;

    const selectedSuiteDetails = suites[properties.testID];
    const started = dayjs(run.started);

    const closeTimeline = () =>
        setChoices(choices.filter((x) => x != optionsForEntities[0]));
    const setTestID = (detailed: string) => {
        setDetailed(detailed);
        properties.setTestID(detailed);
    };

    const rawSource = [
        ...Object.values(tests),
        ...Object.values(suites),
    ].filter((test) => {
        let result = test.parent === selectedSuiteDetails.suiteID;
        result &&= filterStatus == undefined || test.standing === filterStatus;
        result &&= filterText == undefined || test.title.includes(filterText);
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
            if (hasRequiredAttachment != undefined) {
                actions.push(
                    <Button
                        key="attachments"
                        shape="circle"
                        size="small"
                        icon={<PaperClipOutlined />}
                        onClick={openDetailedView.bind(undefined, imagesTab)}
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
                    onClick={openDetailedView.bind(undefined, errorsTab)}
                />,
            );
        }

        return {
            key: test.suiteID,
            label: (
                <Space align="end" id={test.suiteID}>
                    <RenderStatus value={test.standing} />
                    <Text ellipsis={{ tooltip: true }} style={{ width: 460 }}>
                        {test.title}
                    </Text>
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

    const testAttachments = Object.values(attachments)
        .flat()
        .filter(
            (attached) =>
                tests[attached.entity_id]?.parent ===
                selectedSuiteDetails.suiteID,
        );

    const savedAttachments = Object.values(writtenAttachments)
        .flat()
        .filter(
            (attached) =>
                tests[attached.entity_id]?.parent ===
                selectedSuiteDetails.suiteID,
        );
    const aboutSuite: DescriptionsProps['items'] = [
        {
            key: 'range',
            label: 'Range',
            children: (
                <RelativeTo
                    dateTime={dayjs(selectedSuiteDetails.started)}
                    secondDateTime={dayjs(selectedSuiteDetails.ended)}
                    style={{
                        maxWidth: '180px',
                    }}
                    autoPlay={true}
                />
            ),
            span: 1.5,
        },
        {
            key: 'duration',
            label: 'Duration',
            children: (
                <RenderDuration
                    value={dayjs.duration(selectedSuiteDetails.duration)}
                    style={{ maxWidth: '75px' }}
                    autoPlay={true}
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
            key: 'images',
            label: 'Images',
            children: (
                <Counter
                    end={
                        savedAttachments.filter(
                            (attach) => attach.type === 'PNG',
                        ).length
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

        {
            key: 'assertions',
            label: 'Assertions',
            children: (
                <Counter
                    end={
                        testAttachments.filter(
                            (attach) => attach.type === 'ASSERT',
                        ).length
                    }
                />
            ),
        },
    ];

    const statusOptions: SelectProps['options'] = [
        'Passed',
        'Failed',
        'Skipped',
        'Retried',
    ].map((status) => ({
        label: <Text>{status}</Text>,

        value: status.toUpperCase(),
    }));

    return (
        <>
            <Drawer
                open={properties.open}
                onClose={() => {
                    properties.onClose();
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
                            selected={properties.testID}
                            setTestID={setTestID}
                        />
                    </Space>
                }
                size="large"
                width={700}
                extra={
                    <Space>
                        <CheckableTag
                            checked={showFilter}
                            onClick={() => setShowFilter(!showFilter)}
                            className={showFilter ? 'retried-glow' : ''}
                        >
                            <FilterOutlined
                                style={{
                                    fontSize: 15,
                                    color: showFilter ? 'black' : 'orangered',
                                }}
                            />
                        </CheckableTag>
                        <NavigationButtons
                            selectedSuite={selectedSuiteDetails}
                            setTestID={setTestID}
                        />
                    </Space>
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
                        {showFilter ? (
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
                                        setFilterText(
                                            value === '' ? undefined : value,
                                        );
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
                                    popupMatchSelectWidth={120}
                                    style={{ width: 90 }}
                                />
                                <Button
                                    key="attachments"
                                    shape="circle"
                                    size="small"
                                    icon={<PaperClipOutlined />}
                                    onClick={() => [
                                        setDetailed(properties.testID),
                                        setShowDetailedView(true),
                                    ]}
                                />
                            </Space>
                        ) : (
                            <></>
                        )}
                        <Meta
                            style={{ marginTop: showFilter ? '12px' : '0px' }}
                            description={
                                selectedSuiteDetails?.description?.length >
                                0 ? (
                                    selectedSuiteDetails.description
                                ) : (
                                    <Text italic>No Description Provided</Text>
                                )
                            }
                        />
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
