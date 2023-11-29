import type TestRunRecord from 'src/types/testRunRecords';
import React, { useState, type ReactNode } from 'react';
import { parseDetailedTestRun } from 'src/components/parseUtils';
import RenderTimeRelativeToStart, {
    RenderDuration,
} from 'src/components/utils/renderers';
import AreaChartForRuns from 'src/components/charts/collectionOfRuns';
import RenderPassedRate from 'src/components/charts/StackedBarChart';
import crumbs from './Items';
import type { QuickPreviewForTestRun } from 'src/types/parsedRecords';
import { dateFormatUsed } from 'src/components/utils/Datetime/format';
import HeaderStyles from 'src/styles/header.module.css';

import Switch from 'antd/lib/switch';
import List from 'antd/lib/list';
import Space from 'antd/lib/space';
import Collapse from 'antd/lib/collapse/Collapse';
import Card from 'antd/lib/card/Card';
import dayjs, { type Dayjs } from 'dayjs';
import Layout from 'antd/lib/layout/index';
import Empty from 'antd/lib/empty/index';
import Tooltip from 'antd/lib/tooltip/index';
import Divider from 'antd/lib/divider/index';
import Select from 'antd/lib/select/index';
import BreadCrumb from 'antd/lib/breadcrumb/Breadcrumb';
import DatePicker from 'antd/lib/date-picker/index';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import Text from 'antd/lib/typography/Text';
import Link from 'antd/lib/typography/Link';
import isBetween from 'dayjs/plugin/isBetween';
import Button from 'antd/lib/button/button';

dayjs.extend(isBetween);

function RunCard(props: { run: QuickPreviewForTestRun }): ReactNode {
    const [isTest, showTest] = useState(true);
    const item = props.run;

    return (
        <List.Item
            key={item.Link}
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
                    />
                </Space>,
            ]}
        >
            <List.Item.Meta
                title={
                    <Link href={item.Link}>{`${item.Started[0].format(
                        dateFormatUsed,
                    )} - ${item.Title}`}</Link>
                }
                description={
                    <Tooltip
                        title="Start Time | End Time | Duration (in s)"
                        color="volcano"
                        placement="bottomRight"
                        arrow
                    >
                        <Space
                            size="small"
                            align="baseline"
                            split={
                                <Divider
                                    type="vertical"
                                    style={{ margin: '0px' }}
                                />
                            }
                        >
                            <RenderTimeRelativeToStart
                                value={item.Started}
                                style={{ maxWidth: '103px' }}
                            />
                            <RenderTimeRelativeToStart
                                value={item.Ended}
                                style={{ maxWidth: '103px' }}
                            />
                            <RenderDuration
                                value={item.Duration}
                                style={{
                                    minWidth: '90px',
                                    maxWidth: '90px',
                                }}
                            />
                        </Space>
                    </Tooltip>
                }
            />
        </List.Item>
    );
}

function RawList(props: {
    dataSource: Array<undefined | QuickPreviewForTestRun>;
}): ReactNode {
    const [showMax, setShowMax] = useState<number>(10);
    const items = props.dataSource?.slice(0, showMax);
    return (
        <List
            bordered
            itemLayout="vertical"
            size="small"
            dataSource={items}
            renderItem={(item) =>
                item != null ? <RunCard run={item} /> : <></>
            }
            loadMore={
                props.dataSource.length > showMax ? (
                    <Button
                        size="middle"
                        style={{ width: '100%', marginTop: '1px' }}
                        onClick={() => {
                            setShowMax(showMax + 10);
                        }}
                    >
                        Load More
                    </Button>
                ) : (
                    <></>
                )
            }
        />
    );
}

function ListOfRuns(props: { runs: TestRunRecord[] }): ReactNode {
    const details = props.runs.map(parseDetailedTestRun);
    const firstRun = details.at(0);
    const chronological = details.slice(1);

    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    const startOfThisMonth = today.startOf('month');
    const thisWeek = yesterday.subtract(yesterday.get('day') + 1, 'days');
    const thisMonth = yesterday.set('date', 1);

    const forPrevMonth = chronological.filter((run) =>
        run.Started[0].isBefore(startOfThisMonth),
    );

    const forThisMonth = chronological.filter(
        (run) =>
            run.Started[0].isAfter(thisMonth.subtract(1, 'day'), 'date') &&
            run.Started[0].isBefore(thisWeek, 'date'),
    );

    const forThisWeek = chronological.filter(
        (run) =>
            run.Started[0].isAfter(thisWeek, 'date') &&
            run.Started[0].isBefore(yesterday, 'date'),
    );

    const forYesterday = chronological.filter((run) =>
        run.Started[0].isSame(yesterday, 'date'),
    );

    const forToday = chronological.filter((run) =>
        run.Started[0].isSame(today, 'date'),
    );

    const data = [
        { items: [firstRun], label: 'Latest Run' },
        {
            items: forToday,
            label: 'Today',
        },
        {
            items: forYesterday,
            label: 'Yesterday',
        },
        {
            items: forThisWeek,
            label: 'This Week',
        },
        {
            items: forThisMonth,
            label: 'This Month',
        },
        {
            items: forPrevMonth,
            label: 'Prev Month',
        },
    ]
        .filter((item) => item.items.length > 0)
        .map((item) => ({
            key: item.label,
            label: item.label,
            extra: <Text type="secondary">{`(${item.items.length})`}</Text>,
            children: <RawList dataSource={item.items} />,
        }));

    return (
        <Collapse
            size="small"
            accordion
            items={data}
            defaultActiveKey={['Latest Run']}
            bordered
            style={{ height: '100%' }}
        />
    );
}

function ListOfCharts(props: { runs: TestRunRecord[] }): ReactNode {
    const [isTest, showTest] = useState(true);
    const areaChart = (
        <Card
            title="Test Runs"
            bordered={true}
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
                />
            }
        >
            <AreaChartForRuns runs={props.runs} showTest={isTest} />
        </Card>
    );

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {areaChart}
        </Space>
    );
}

export default function GridOfRuns(props: {
    runs: TestRunRecord[];
}): ReactNode {
    const [selectedProjectName, filterProjectName] = useState<string>();
    const [dateRange, setDateRange] = useState<
        null | [null | Dayjs, null | Dayjs]
    >();

    if (props.runs.length === 0) {
        return (
            <Layout style={{ height: '100%' }}>
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

    const filteredRuns = props.runs.filter((run) => {
        const started = dayjs(run.started);
        return (
            (selectedProjectName == null ||
                run.projectName === selectedProjectName) &&
            (dateRange == null ||
                started.isBetween(dateRange[0], dateRange[1], 'date', '[]'))
        );
    });

    let body;

    if (filteredRuns.length === 0) {
        body = (
            <Space
                direction="horizontal"
                style={{ height: '100%', justifyContent: 'center' }}
            >
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={'No Filtered Results found'}
                />
            </Space>
        );
    } else {
        body = (
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
    }

    const projectNames = Array.from(
        new Set(props.runs.map((run) => run.projectName)),
    ).map((projectName) => ({ label: projectName, value: projectName }));

    return (
        <Layout
            style={{
                overflow: 'hidden',
                height: '99.6vh',
            }}
        >
            <Layout.Header className={HeaderStyles.header} spellCheck>
                <Space align="baseline" size="large">
                    <BreadCrumb items={crumbs(false, filteredRuns.length)} />
                    <Divider type="vertical" />
                    <Tooltip title="Filters are on the right">
                        <FilterOutlined />
                    </Tooltip>
                    <Select
                        options={projectNames}
                        allowClear
                        value={selectedProjectName}
                        placeholder="Select Project Name"
                        style={{ minWidth: '180px' }}
                        onChange={(selected) => {
                            filterProjectName(selected);
                        }}
                    />
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={(values) => {
                            setDateRange(values);
                        }}
                    />
                </Space>
            </Layout.Header>
            {body}
        </Layout>
    );
}
