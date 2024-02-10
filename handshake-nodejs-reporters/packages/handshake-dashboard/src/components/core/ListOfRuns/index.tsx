import type TestRunRecord from 'src/types/test-run-records';
import React, { useState, type ReactNode } from 'react';
import { parseDetailedTestRun } from 'src/components/parse-utils';
import { RenderDuration } from 'src/components/utils/relative-time';
import AreaChartForRuns from 'src/components/charts/collection-of-runs';
import RenderPassedRate from 'src/components/charts/stacked-bar-chart';
import crumbs from './test-items';
import { dateFormatUsed } from 'src/components/utils/Datetime/format';
import HeaderStyles from 'src/styles/header.module.css';
import Switch from 'antd/lib/switch';
import List from 'antd/lib/list';
import Space from 'antd/lib/space';
import type { CollapseProps } from 'antd/lib/collapse/Collapse';
import Collapse from 'antd/lib/collapse/Collapse';
import Card from 'antd/lib/card/Card';
import dayjs, { type Dayjs } from 'dayjs';
import Layout from 'antd/lib/layout/index';
import Empty from 'antd/lib/empty/index';
import Button from 'antd/lib/button/button';
import Tooltip from 'antd/lib/tooltip/index';
import Divider from 'antd/lib/divider/index';
import Select from 'antd/lib/select/index';
import BreadCrumb from 'antd/lib/breadcrumb/Breadcrumb';
import DatePicker from 'antd/lib/date-picker/index';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import Text from 'antd/lib/typography/Text';
import Link from 'antd/lib/typography/Link';
import isBetween from 'dayjs/plugin/isBetween';
import type { RangePickerProps } from 'antd/lib/date-picker';
import Tag from 'antd/lib/tag/index';
import RelativeTo from 'src/components/utils/Datetime/relative-time';
import {
    GithubRepoLink,
    RenderFrameworkUsed,
    RenderStatus,
} from 'src/components/utils/renderers';
import type { DetailedTestRecord } from 'src/types/parsed-records';
import { LOCATORS, TEXT } from 'handshake-utils';
import type { TestRecord } from 'src/types/test-run-records';
import Ribbon from 'antd/lib/badge/Ribbon';

dayjs.extend(isBetween);

function RunCard(properties: { run: DetailedTestRecord }): ReactNode {
    const [isTest, showTest] = useState(true);
    const item = properties.run;

    return (
        <Ribbon
            text={
                <Text style={{ fontSize: '.69rem' }} italic>
                    {item.projectName}
                </Text>
            }
            color="purple"
        >
            <List.Item
                key={item.Link}
                id={item.Id}
                actions={[
                    <Space key={'space'}>
                        <RenderPassedRate
                            value={isTest ? item.Rate : item.SuitesSummary}
                            key={'chart'}
                            width={235}
                            title={isTest ? 'Tests' : 'Suites'}
                        />
                        <Switch
                            key={'switch'}
                            defaultChecked
                            size="small"
                            checkedChildren={<>Tests</>}
                            unCheckedChildren={<>Suites</>}
                            onChange={(checked) => {
                                showTest(checked);
                            }}
                            checked={isTest}
                            className="switch"
                        />
                    </Space>,
                ]}
            >
                <List.Item.Meta
                    title={
                        <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                        >
                            <Space align="start">
                                <RenderFrameworkUsed
                                    frameworks={item.Frameworks}
                                />
                                <RenderStatus value={item.Status} />
                                <Link
                                    href={item.Link}
                                    id={`${LOCATORS.RUNS.testRunName}${item.Id}`}
                                >{`${item.Started[0].format(dateFormatUsed)}`}</Link>
                            </Space>
                        </div>
                    }
                    description={
                        <Tooltip
                            title={TEXT.RUNS.noteForTime}
                            color="volcano"
                            placement="bottomRight"
                            arrow
                            className="tooltip"
                        >
                            <Space align="start" size={0}>
                                <Tag color="cyan" className="time-range">
                                    <RelativeTo
                                        dateTime={item.Started[0]}
                                        secondDateTime={item.Ended[0]}
                                        autoPlay
                                        style={{
                                            maxWidth: '170px',
                                            textAlign: 'right',
                                        }}
                                    />
                                </Tag>
                                <Tag
                                    color="volcano"
                                    style={{
                                        minWidth: '95px',
                                        maxWidth: '95px',
                                    }}
                                    className="duration"
                                >
                                    <RenderDuration
                                        value={item.Duration}
                                        autoPlay={true}
                                    />
                                </Tag>
                            </Space>
                        </Tooltip>
                    }
                />
            </List.Item>
        </Ribbon>
    );
}

function RawList(properties: {
    dataSource: Array<undefined | DetailedTestRecord>;
    id: string;
}): ReactNode {
    const [showMax, setShowMax] = useState<number>(10);
    const items = properties.dataSource?.slice(0, showMax);
    return (
        <List
            bordered
            itemLayout="vertical"
            size="small"
            id={properties.id}
            dataSource={items}
            renderItem={(item) =>
                item == undefined ? <></> : <RunCard run={item} />
            }
            loadMore={
                properties.dataSource.length > showMax ? (
                    <Button
                        size="middle"
                        style={{ width: '100%', marginTop: '1px' }}
                        type="text"
                        onClick={() => {
                            setShowMax(showMax + 10);
                        }}
                    >
                        Show More
                    </Button>
                ) : (
                    <></>
                )
            }
        />
    );
}

function ListOfRuns(properties: { runs: TestRunRecord[] }): ReactNode {
    const details = properties.runs.map((element) =>
        parseDetailedTestRun(element),
    );
    const firstRun = details.at(0);
    const chronological = details.slice(1);

    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    const startOfThisMonth = today.startOf('month');
    const thisWeek = today.startOf('week');
    const thisMonth = yesterday.set('date', 1);

    const forPreviousMonth = chronological.filter((run) =>
        run.Started[0].isBefore(startOfThisMonth),
    );

    const forThisMonth = chronological.filter((run) =>
        run.Started[0].isBetween(
            thisMonth.subtract(1, 'day'),
            thisWeek,
            'date',
            '[)',
        ),
    );

    const forThisWeek = chronological.filter((run) =>
        run.Started[0].isBetween(thisWeek, yesterday, 'date', '[)'),
    );

    const forYesterday = chronological.filter((run) =>
        run.Started[0].isSame(yesterday, 'date'),
    );

    const forToday = chronological.filter((run) =>
        run.Started[0].isSame(today, 'date'),
    );

    const data: CollapseProps['items'] = [
        { items: [firstRun], label: 'Latest Run', id: LOCATORS.RUNS.latestRun },
        {
            items: forToday,
            label: 'Today',
            id: LOCATORS.RUNS.today,
        },
        {
            items: forYesterday,
            label: 'Yesterday',
            id: LOCATORS.RUNS.yesterday,
        },
        {
            items: forThisWeek,
            label: 'This Week',
            id: LOCATORS.RUNS.thisWeek,
        },
        {
            items: forThisMonth,
            label: 'This Month',
            id: LOCATORS.RUNS.forThisMonth,
        },
        {
            items: forPreviousMonth,
            label: 'Prev Month',
            id: LOCATORS.RUNS.prevMonth,
        },
    ]
        .filter((item) => item.items.length > 0)
        .map((item) => ({
            key: item.label,
            label: <Text id={item.id}>{item.label}</Text>,
            extra: (
                <Text
                    type="secondary"
                    id={`${item.id}-count`}
                >{`(${item.items.length})`}</Text>
            ),
            children: (
                <RawList dataSource={item.items} id={`${item.id}-list`} />
            ),
        }));

    return (
        <Collapse
            size="small"
            accordion
            items={data}
            defaultActiveKey={['Latest Run']}
            bordered
            style={{ height: '100%' }}
            key={LOCATORS.RUNS.testRuns}
        />
    );
}

function ListOfCharts(properties: { runs: TestRunRecord[] }): ReactNode {
    const [isTest, showTest] = useState(true);
    const sortedOrder = [...properties.runs].reverse();
    const areaChart = (
        <Card
            title="Test Runs"
            bordered={true}
            id={LOCATORS.RUNS.testRunsCard}
            size="small"
            extra={
                <Switch
                    defaultChecked
                    checkedChildren={<>Tests</>}
                    unCheckedChildren={<>Suites</>}
                    onChange={(checked) => {
                        showTest(checked);
                    }}
                    checked={isTest}
                    className="switch"
                    id={LOCATORS.RUNS.testRunsSwitch}
                />
            }
        >
            <AreaChartForRuns runs={sortedOrder} showTest={isTest} />
        </Card>
    );

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {areaChart}
        </Space>
    );
}

export default function GridOfRuns(properties: {
    runs: TestRecord[];
}): ReactNode {
    const [selectedProjectName, filterProjectName] = useState<string>();
    const [dateRange, setDateRange] = useState<
        null | [null | Dayjs, null | Dayjs]
    >();

    if (properties.runs.length === 0) {
        return (
            <Layout style={{ height: '100%' }}>
                <Layout.Header className={HeaderStyles.header} spellCheck>
                    <Space
                        style={{
                            justifyContent: 'space-between',
                            width: '100%',
                            marginRight: '20px',
                        }}
                        align="center"
                    >
                        <BreadCrumb items={crumbs(false)} />
                        <GithubRepoLink />
                    </Space>
                </Layout.Header>
                <Space
                    direction="horizontal"
                    style={{ height: '100%', justifyContent: 'center' }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            'No Runs Found!, Please run your test suite'
                        }
                    />
                </Space>
            </Layout>
        );
    }

    const filteredRuns = properties.runs.filter((run) => {
        const started = dayjs(run.started);
        return (
            (selectedProjectName == undefined ||
                run.projectName === selectedProjectName) &&
            (dateRange == undefined ||
                started.isBetween(dateRange[0], dateRange[1], 'date', '[]'))
        );
    });

    const body =
        filteredRuns.length === 0 ? (
            <Space
                direction="horizontal"
                style={{ height: '100%', justifyContent: 'center' }}
            >
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={'No Filtered Results found'}
                />
            </Space>
        ) : (
            <Layout hasSider>
                <Layout.Sider
                    width={350}
                    theme={'light'}
                    style={{
                        margin: '6px',
                        overflow: 'auto',
                    }}
                >
                    <ListOfRuns runs={filteredRuns} />
                </Layout.Sider>
                <Layout.Content
                    style={{
                        margin: '6px',
                        overflow: 'auto',
                        paddingBottom: '13px',
                    }}
                >
                    <ListOfCharts runs={filteredRuns} />
                </Layout.Content>
            </Layout>
        );

    const projectNames = [
        ...new Set(properties.runs.map((run) => run.projectName)),
    ].map((projectName) => ({ label: projectName, value: projectName }));

    const disabledDate: RangePickerProps['disabledDate'] = (
        current: dayjs.Dayjs,
    ) => {
        return !current.isBetween(
            dayjs(properties.runs.at(0)?.started),
            dayjs(properties.runs.at(-1)?.started),
            'date',
            '[]',
        );
    };

    return (
        <Layout
            style={{
                overflow: 'hidden',
                height: '99.6vh',
            }}
        >
            <Layout.Header className={HeaderStyles.header} spellCheck>
                <Space
                    style={{
                        justifyContent: 'space-between',
                        width: '100%',
                        marginRight: '20px',
                        marginTop: '1px',
                    }}
                    align="center"
                >
                    <Space align="baseline" size="large">
                        <BreadCrumb
                            items={crumbs(false, filteredRuns.length)}
                        />
                        <Divider type="vertical" />
                        <Tooltip title="Filters are on the right">
                            <FilterOutlined />
                        </Tooltip>
                        <Select
                            options={projectNames}
                            allowClear
                            value={selectedProjectName}
                            placeholder="Select Project Name"
                            id={LOCATORS.RUNS.projectNameDropdown}
                            style={{ minWidth: '180px' }}
                            onChange={(selected) => {
                                filterProjectName(selected);
                            }}
                        />
                        <DatePicker.RangePicker
                            value={dateRange}
                            id={LOCATORS.RUNS.dateRangeSelector}
                            onChange={(values) => {
                                setDateRange(values);
                            }}
                            disabledDate={disabledDate}
                        />
                    </Space>
                    <GithubRepoLink />
                </Space>
            </Layout.Header>
            {body}
        </Layout>
    );
}
