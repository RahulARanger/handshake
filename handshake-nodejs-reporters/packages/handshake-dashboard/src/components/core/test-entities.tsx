import { menuTabs } from 'src/types/ui-constants';
import type { statusOfEntity } from 'src/types/session-records';
import type { possibleEntityNames } from 'src/types/session-records';
import { RenderEntityType, RenderStatus } from '../utils/renderers';
import RenderPassedRate, { SwitchValues } from '../charts/stacked-bar-chart';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import React, { useContext, type ReactNode, useState, useRef } from 'react';
import { type Dayjs } from 'dayjs';
import Table from 'antd/lib/table/Table';
import Button from 'antd/lib/button/button';
import Space from 'antd/lib/space/index';
import type { Duration } from 'dayjs/plugin/duration';
import Typography from 'antd/lib/typography/Typography';
import Text from 'antd/lib/typography/Text';
import { timeFormatUsed } from '../utils/Datetime/format';
import Badge from 'antd/lib/badge/index';
import type { InputRef } from 'antd/lib';
import { Spin, Tabs } from 'antd/lib';
import RelativeTo, { RenderDuration } from '../utils/Datetime/relative-time';
import { StaticPercent } from '../utils/counter';
import { DetailedContext } from '@/types/records-in-detailed';
import type { ParsedSuiteRecord, SuiteDetails } from 'src/types/parsed-records';
import ProjectStructure from './TestRun/structure-tab';
import DetailedTestEntity from './TestEntity';
import Dotted from 'src/styles/dotted.module.css';
import Search from 'antd/lib/input/Search';
import TextShadow from '@/styles/text-shadow.module.css';
import CardStyles from '@/styles/card.module.css';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import { TestEntitiesOverTime } from '../charts/collection-of-runs';

export function TestRunStarted(): ReactNode {
    const context = useContext(DetailedContext);
    if (context == undefined)
        return <Text>There&apos;s no context over the current Test run</Text>;
    const { detailsOfTestRun } = context;
    return (
        <Typography>{`Test Run Started at: ${detailsOfTestRun.Started[0].format(
            timeFormatUsed,
        )}`}</Typography>
    );
}

function extractSuiteTree(
    suites: SuiteDetails,
    parent?: string,
): undefined | ParsedSuiteRecord[] {
    const result = [
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
        ...suites['@order'],
    ]
        .filter(
            (suiteID) =>
                suites[suiteID].Parent === (parent ?? '') &&
                suites[suiteID].Status !== 'RETRIED',
        )
        .map((suiteID) => ({
            children: extractSuiteTree(suites, suiteID),
            key: suiteID,
            ...suites[suiteID],
        }));
    return result.length > 0 ? result : undefined;
}

export default function TestEntities(properties: {
    defaultTab: string;
    setHightLight: (_: string) => void;
}): ReactNode {
    const context = useContext(DetailedContext);
    const [toShowTestID, setTestID] = useState<string>();
    const [showEntity, setShowEntity] = useState<boolean>(false);
    const [filterSuite, setFilterSuite] = useState<string>('');
    const [showSuiteFilter, setShowSuiteFilter] = useState<boolean>(false);
    const [showRollup, setShowRollup] = useState<boolean>(true);

    const suiteSearchBar = useRef<InputRef>(null);
    const found = useRef<string[]>([]);

    if (context == undefined) return <></>;
    const { suites, retriedRecords } = context;

    const onClose = (): void => {
        setShowEntity(false);
        properties.setHightLight('');
    };

    const helperToSetTestID = (testID: string): void => {
        setTestID(testID);
        properties.setHightLight(suites[testID].Title);
        setShowEntity(true);
    };

    const helperToSearchSuite = (name: string): void => {
        found.current.splice(0, found.current.length);
        setFilterSuite(name);
    };

    let selectedTab = <></>;

    switch (properties.defaultTab) {
        default: {
            return <Spin tip="Loading..." fullscreen size="large" />;
        }
        case menuTabs.testEntitiesTab.gridViewMode: {
            selectedTab = (
                <Table
                    dataSource={extractSuiteTree(suites)}
                    size="small"
                    bordered
                    className={CardStyles.boardCard}
                    style={{ borderTopLeftRadius: 10 }}
                    scroll={{ x: 'max-content' }}
                >
                    <Table.Column
                        title="Status"
                        width={60}
                        align="justify"
                        dataIndex="Status"
                        render={(value: statusOfEntity) => (
                            <RenderStatus value={value} />
                        )}
                        fixed="left"
                    />
                    <Table.Column
                        title="Name"
                        dataIndex="Title"
                        width={200}
                        fixed="left"
                        filterSearch={true}
                        sorter={(
                            leftName: ParsedSuiteRecord,
                            rightName: ParsedSuiteRecord,
                        ) => leftName.Title.localeCompare(rightName.Title)}
                        filterIcon={
                            <Button
                                type={showSuiteFilter ? 'primary' : 'text'}
                                size="small"
                                icon={<SearchOutlined />}
                                onClick={() => {
                                    setShowSuiteFilter(!showSuiteFilter);
                                    if (!showSuiteFilter)
                                        suiteSearchBar.current?.focus();
                                }}
                            />
                        }
                        onFilter={(value, record: ParsedSuiteRecord) => {
                            if (found.current.includes(record.Id)) return true;

                            const result =
                                record._UseFilterForTitle.includes(filterSuite);
                            if (result) found.current.push(record.Parent);
                            return result;
                        }}
                        filterDropdownOpen={showSuiteFilter}
                        filterDropdown={({
                            setSelectedKeys,
                            selectedKeys,
                            confirm,
                            clearFilters,
                        }) => (
                            <Space
                                className={CardStyles.card}
                                style={{
                                    padding: '10px',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '10px',
                                }}
                            >
                                <Search
                                    placeholder="Search Suites..."
                                    value={selectedKeys[0]}
                                    ref={suiteSearchBar}
                                    allowClear
                                    styles={{
                                        affixWrapper: {
                                            backgroundColor: 'transparent',
                                        },
                                    }}
                                    className={TextShadow.insetShadow}
                                    addonAfter={
                                        <Button
                                            type="text"
                                            size="small"
                                            onClick={() => {
                                                if (clearFilters)
                                                    clearFilters();
                                                helperToSearchSuite('');
                                                setShowSuiteFilter(false);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    }
                                    onKeyDown={(
                                        event_: KeyboardEvent<HTMLInputElement>,
                                    ) => {
                                        if (event_.key === 'Escape')
                                            setShowSuiteFilter(false);
                                    }}
                                    onChange={(
                                        event_: ChangeEvent<HTMLInputElement>,
                                    ) =>
                                        setSelectedKeys(
                                            event_.target.value
                                                ? [event_.target.value]
                                                : [],
                                        )
                                    }
                                    onSearch={(
                                        value,
                                        event:
                                            | KeyboardEvent<HTMLInputElement>
                                            | ChangeEvent<HTMLInputElement>
                                            | MouseEvent<HTMLElement>
                                            | undefined,
                                    ) => {
                                        confirm();
                                        if (event?.type === 'keydown')
                                            setShowSuiteFilter(false);
                                        helperToSearchSuite(
                                            value?.trim()?.toLowerCase() ?? '',
                                        );
                                    }}
                                />
                            </Space>
                        )}
                        render={(value: string, record: ParsedSuiteRecord) => (
                            <Space>
                                <Button
                                    type="link"
                                    onClick={() => helperToSetTestID(record.Id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '2px',
                                        margin: '0px',
                                    }}
                                >
                                    <Text className={Dotted.suiteName}>
                                        {value}
                                    </Text>
                                </Button>
                            </Space>
                        )}
                    />
                    <Table.Column
                        title="Progress"
                        dataIndex={showRollup ? 'RollupValues' : 'Rate'}
                        width={60}
                        sorter={(
                            a: ParsedSuiteRecord,
                            b: ParsedSuiteRecord,
                        ) => {
                            return a.RollupValues[0] - b.RollupValues[0];
                        }}
                        filterSearch={true}
                        filterIcon={
                            <SwitchValues
                                smallSize
                                defaultIsRollup={showRollup}
                                onChange={(isRollup) => setShowRollup(isRollup)}
                            />
                        }
                        filterDropdown={() => <></>}
                        render={(
                            value: [number, number, number],
                            record: ParsedSuiteRecord,
                        ) => (
                            <Badge
                                count={
                                    (retriedRecords[record.Id]?.length ?? 1) - 1
                                }
                                showZero={false}
                                size="small"
                                status="warning"
                                title="Retried"
                            >
                                <RenderPassedRate
                                    value={value}
                                    width={160}
                                    immutable={true}
                                />
                            </Badge>
                        )}
                    />

                    <Table.Column
                        dataIndex="Started"
                        title="Range"
                        width={165}
                        render={(
                            value: [Dayjs, Dayjs],
                            record: ParsedSuiteRecord,
                        ) => (
                            <RelativeTo
                                dateTime={value[0]}
                                secondDateTime={record.Ended[0]}
                                style={{
                                    maxWidth: '165px',
                                    textAlign: 'right',
                                }}
                            />
                        )}
                    />

                    <Table.Column
                        dataIndex="Contribution"
                        title="Contribution"
                        width={50}
                        align="center"
                        render={(_) => (
                            <StaticPercent
                                percent={Number(_.toFixed(2)) * 1e2}
                            />
                        )}
                    />

                    <Table.Column
                        title="Duration"
                        width={100}
                        align="center"
                        dataIndex="Duration"
                        render={(value: Duration) => (
                            <RenderDuration duration={value} width="120px" />
                        )}
                    />

                    <Table.Column
                        title="Entity"
                        width={25}
                        dataIndex="entityName"
                        align="center"
                        render={(
                            value: possibleEntityNames,
                            record: ParsedSuiteRecord,
                        ) => (
                            <Space>
                                <RenderEntityType
                                    entityName={value}
                                    entityVersion={record.entityVersion}
                                    simplified={record.simplified}
                                />
                            </Space>
                        )}
                    />
                    <Table.Column
                        dataIndex="File"
                        title="File"
                        width={100}
                        render={(value) => (
                            <Text className={Dotted.suiteName}>
                                {(value as string).replace(/^.*[/\\]/, '')}
                            </Text>
                        )}
                    />
                </Table>
            );
            break;
        }
        case menuTabs.testEntitiesTab.treeViewMode: {
            selectedTab = <ProjectStructure setTestID={helperToSetTestID} />;
            break;
        }
    }

    return (
        <>
            <Tabs
                activeKey={showEntity ? 'detailed' : 'selected'}
                renderTabBar={() => <></>}
                animated
                items={[
                    {
                        key: 'selected',
                        label: 'selected',
                        children: selectedTab,
                    },
                    {
                        key: 'detailed',
                        label: 'detailed',
                        children: (
                            <DetailedTestEntity
                                open={showEntity}
                                onClose={onClose}
                                testID={toShowTestID}
                                setTestID={helperToSetTestID}
                            />
                        ),
                        style: {
                            height: '89vh',
                            overflow: 'clip',
                            minHeight: '500px',
                            paddingBottom: '3px',
                        },
                    },
                ]}
            />
        </>
    );
}
