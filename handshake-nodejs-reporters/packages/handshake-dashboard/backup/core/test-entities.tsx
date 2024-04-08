import { menuTabs } from 'types/ui-constants';
import type { statusOfEntity } from 'types/session-records';
import type { possibleEntityNames } from 'types/session-records';
import {
    RenderEntityType,
    RenderFilePath,
    RenderStatus,
} from 'components/renderers';
import RenderPassedRate, { SwitchValues } from '../charts/stacked-bar-chart';
import React, { useContext, type ReactNode, useState, useRef } from 'react';
import { type Dayjs } from 'dayjs';
import Table from 'antd/lib/table/Table';
import Button from 'antd/lib/button/button';
import Space from 'antd/lib/space/index';
import type { Duration } from 'dayjs/plugin/duration';
import Typography from 'antd/lib/typography/Typography';
import Text from 'antd/lib/typography/Text';
import { timeFormatUsed } from '../datetime/format';
import type { InputRef } from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import Tabs from 'antd/lib/tabs';
import RelativeTo, { RenderDuration } from 'components/datetime/relative-time';
import Counter, { ShowContribution } from 'components/charts/counter';
import { DetailedContext } from 'types/records-in-detailed';
import Highlighter from 'react-highlight-words';
import type { ParsedSuiteRecord, SuiteDetails } from 'types/parsed-records';
import ProjectStructure from './TestRun/structure-tab';
import DetailedTestEntity from './TestEntity';
import Dotted from 'styles/dotted.module.css';
import CardStyles from 'styles/card.module.css';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import SearchEntities from 'components/search-bar';

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
    const result = suites['@order']
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
    const { suites, retriedRecords, detailsOfTestRun } = context;

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
                    rootClassName="smooth-box"
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
                        width={250}
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
                                <SearchEntities
                                    placeholder="Search Suites..."
                                    value={selectedKeys[0] as string}
                                    onClear={() => {
                                        if (clearFilters) clearFilters();
                                        helperToSearchSuite('');
                                        setShowSuiteFilter(false);
                                    }}
                                    reference={suiteSearchBar}
                                    onChange={(value: string) =>
                                        setSelectedKeys(value ? [value] : [])
                                    }
                                    onEscape={() => {
                                        setShowSuiteFilter(false);
                                    }}
                                    onSearch={(
                                        value: string,
                                        hide: boolean,
                                    ) => {
                                        confirm();
                                        if (hide) setShowSuiteFilter(false);
                                        helperToSearchSuite(value);
                                    }}
                                />
                            </Space>
                        )}
                        render={(value: string, record: ParsedSuiteRecord) => (
                            <Space
                                align="start"
                                style={{ width: '100%', cursor: 'pointer' }}
                                onClick={() => helperToSetTestID(record.Id)}
                            >
                                <Button
                                    type="link"
                                    style={{
                                        textAlign: 'left',
                                        padding: '2px',
                                        margin: '0px',
                                        color: 'white',
                                    }}
                                >
                                    <Highlighter
                                        className={Dotted.suiteName}
                                        searchWords={[filterSuite]}
                                        textToHighlight={value}
                                    />
                                </Button>
                                <ExportOutlined
                                    style={{
                                        fontSize: 10,
                                    }}
                                />
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
                        render={(value: [number, number, number]) => (
                            <RenderPassedRate
                                value={value}
                                width={180}
                                immutable={true}
                            />
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
                        dataIndex="Tests"
                        title="Tests"
                        width={50}
                        align="center"
                        render={(_) => (
                            <Counter
                                end={_}
                                title="Number of tests inside this suite"
                            />
                        )}
                    />
                    <Table.Column
                        dataIndex="numberOfErrors"
                        title="Errors"
                        width={50}
                        align="center"
                        render={(_) => (
                            <Counter
                                end={_}
                                style={{
                                    color: _ ? 'red' : 'white',
                                    fontWeight: _ ? 'bold' : 'normal',
                                }}
                            />
                        )}
                    />

                    <Table.Column
                        dataIndex="numberOfErrors"
                        title="Retries"
                        width={50}
                        align="center"
                        render={(_, record: ParsedSuiteRecord) => (
                            <Counter
                                end={
                                    (retriedRecords[record.Id]?.length ?? 1) - 1
                                }
                                style={{
                                    color: _ ? 'orangered' : 'white',
                                    fontWeight: _ ? 'bold' : 'normal',
                                }}
                            />
                        )}
                    />
                    <Table.Column
                        dataIndex="Contribution"
                        title="Contributed"
                        width={50}
                        align="center"
                        render={(_, record: ParsedSuiteRecord) => (
                            <ShowContribution
                                percent={_}
                                totalTests={detailsOfTestRun.Tests}
                                testsContributed={record.totalRollupValue}
                            />
                        )}
                    />

                    <Table.Column
                        title="Duration"
                        width={80}
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
                            <RenderFilePath relativePath={value} />
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
