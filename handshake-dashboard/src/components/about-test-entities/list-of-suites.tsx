/* eslint-disable unicorn/no-keyword-prefix */
import {
    ActionIcon,
    Anchor,
    Badge,
    Breadcrumbs,
    Group,
    Menu,
    MenuDropdown,
    MenuItem,
    MenuTarget,
    rem,
    Text,
    Tooltip,
} from '@mantine/core';
import { TimeRange } from 'components/timings/time-range';
import React, { useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { type SuiteRecordDetails } from 'types/test-entity-related';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import type {
    DetailedTestRecord,
    ParsedSuiteRecord,
} from 'types/parsed-records';
import { IconDots, IconFilter } from '@tabler/icons-react';
import useFilteredSuites, {
    DEFAULT_QUERY,
    SearchQuery,
} from 'hooks/filter-test-suites';
import {
    useProcessedTestCases,
    useProcessedTestSuites,
} from 'hooks/get-test-suites';
import TestStatusIcon from 'components/about-test-run/test-status';
import TestEntityStatusMetrics from './test-entity-status';
import 'mantine-react-table/styles.css';
import {
    MantineReactTable,
    MRT_ColumnDef,
    useMantineReactTable,
} from 'mantine-react-table';
import useTableConfigurationsForListOfSuites from 'hooks/get-saved-filters';
import CountUpNumber from 'components/counter';
import { DetailedViewForSuite } from './detailed-test-view';
import GridStyles from 'styles/data-table.module.css';
import TagComp from './tag';

function TableOfSuites(properties: {
    suites: ParsedSuiteRecord[];
    testRecord: DetailedTestRecord;
    levels: SearchQuery['levels'];
    setSearchQuery: Dispatch<SetStateAction<SearchQuery>>;
    onParentFilter: (parentID: string, suiteName: string) => void;
}) {
    const columns = useMemo<MRT_ColumnDef<ParsedSuiteRecord>[]>(
        () => [
            {
                accessorKey: 'hasChildSuite',
                header: '',
                enableSorting: false,
                maxSize: 10,
                enableColumnFilter: false,
                enableHiding: false,
                Cell: ({ row }) => {
                    return row.original.type === 'SUITE' &&
                        row.original.totalRollupValue > 0 ? (
                        <Tooltip
                            label={`Drilldown to find tests/suites grouped under this suite`}
                            withArrow
                            color="cyan"
                        >
                            <ActionIcon
                                variant="light"
                                size="sm"
                                onClick={() =>
                                    properties.onParentFilter(
                                        row.original.Id,
                                        row.original.Title,
                                    )
                                }
                            >
                                <IconFilter
                                    style={{
                                        width: rem(12),
                                        height: rem(12),
                                    }}
                                />
                            </ActionIcon>
                        </Tooltip>
                    ) : (
                        <></>
                    );
                },
                textAlign: 'center',
            },
            {
                accessorKey: 'Status',
                header: 'Status',
                maxSize: 50,
                mantineTableBodyCellProps: {
                    align: 'center',
                },
                Cell: ({ row, renderedRowIndex }) => (
                    <TestStatusIcon
                        status={row.original.Status}
                        key={renderedRowIndex}
                    />
                ),
                filterVariant: 'multi-select',
                mantineFilterMultiSelectProps: {
                    data: [
                        'Passed',
                        'Failed',
                        'Skipped',
                        'Xfailed',
                        'Xpassed',
                    ].map((label) => ({
                        label,
                        value: label.toUpperCase(),
                    })),
                },
            },
            {
                accessorKey: 'type',
                header: 'Type',
                maxSize: 50,
                mantineTableBodyCellProps: {
                    align: 'center',
                },
                Cell: ({ row, renderedRowIndex }) => (
                    <Badge
                        key={renderedRowIndex}
                        color={
                            row.original.type === 'SUITE' ? 'indigo' : 'pink'
                        }
                    >
                        {row.original.type}
                    </Badge>
                ),
                filterVariant: 'multi-select',
            },
            {
                accessorKey: 'Title',
                header: 'Title',
                maxSize: 150,
                enableClickToCopy: true,
            },
            {
                accessorKey: 'File',
                header: 'File',
                enableClickToCopy: true,
                filterVariant: 'autocomplete',
            },
            {
                accessorKey: 'Range',
                header: 'Range',
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <TimeRange
                            startTime={row.original.Started}
                            endTime={row.original.Ended}
                            key={renderedRowIndex}
                            detailed
                            relativeFrom={properties?.testRecord?.Started}
                        />
                    );
                },
            },
            {
                accessorKey: 'Start Time',
                header: 'Start Time',
                maxSize: 100,
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <TimeRange
                            startTime={row.original.Started}
                            key={renderedRowIndex}
                            detailed
                            relativeFrom={properties?.testRecord?.Started}
                        />
                    );
                },
            },
            {
                accessorKey: 'End Time',
                header: 'End Time',
                maxSize: 100,
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <TimeRange
                            startTime={row.original.Ended}
                            key={renderedRowIndex}
                            detailed
                            relativeFrom={properties?.testRecord?.Started}
                        />
                    );
                },
            },
            {
                accessorKey: 'Duration',
                header: 'Duration',
                maxSize: 60,
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <HumanizedDuration
                            duration={row.original.Duration}
                            key={renderedRowIndex}
                        />
                    );
                },
                mantineTableBodyCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'Contribution',
                header: 'Contri.',
                maxSize: 60,
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <CountUpNumber
                            endNumber={
                                (row.original as ParsedSuiteRecord).Contribution
                            }
                            suffix="%"
                            key={renderedRowIndex}
                            size="sm"
                            decimalPoints={2}
                            avoideAnimation
                        />
                    );
                },
                mantineTableBodyCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'totalRollupValue',
                header: 'Tests',
                maxSize: 60,
                mantineTableBodyCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'RollupValues',
                header: 'Entities',
                maxSize: 100,
                Cell: ({ row, renderedRowIndex }) =>
                    row.original.type === 'SUITE' ? (
                        <TestEntityStatusMetrics
                            key={renderedRowIndex}
                            passed={row.original.RollupValues[0]}
                            failed={row.original.RollupValues[1]}
                            skipped={row.original.RollupValues[2]}
                        />
                    ) : (
                        <></>
                    ),
                mantineTableBodyCellProps: {
                    align: 'center',
                },
            },
            {
                accessorKey: 'numberOfErrors',
                header: 'Errors',
                maxSize: 60,
                mantineTableBodyCellProps: {
                    align: 'right',
                },
            },
            {
                accessorKey: 'tags',
                header: 'Tags',
                maxSize: 300,
                mantineTableBodyCellProps: {
                    align: 'right',
                },
                Cell: ({ row, renderedRowIndex }) => {
                    return <Group wrap="nowrap">
                        {row.original.Tags.slice(0, 2).map((tag) => <TagComp key={`${renderedRowIndex}-tag`} tag={tag} size="xs" />)}
                        {row.original.Tags.length > 2 ? <Badge variant="light">+{row.original.Tags.length - 2}</Badge> : <></>}
                    </Group>
                },
            },
        ],
        [properties.testRecord?.Started],
    );
    const [maxWidth, setMaxWidth] = useState('97vw');
    const { columnsShown, setColumnsShown } =
        useTableConfigurationsForListOfSuites();

    const table = useMantineReactTable({
        columns,
        data: properties.suites,
        initialState: {
            density: 'xs',
            columnPinning: { left: ['hasChildSuite'] },
        },
        enablePagination: true,
        enableDensityToggle: false,
        enableColumnPinning: true,
        mantineTableHeadCellProps: {
            style: {
                padding: '10px 5px',
            },
        },
        mantineTopToolbarProps: {
            className: GridStyles.dataTableToolBar,
        },
        mantineTableBodyCellProps: {
            style: {
                padding: '10px 6px',
                borderRight: '1.5px solid rgba(255, 255, 255, 0.08) ',
            },
        },
        mantineTableHeadRowProps: {
            style: {
                backgroundColor: 'rgba(85, 4, 27, 0.71) ',
                borderBottom: '1.5px solid rgba(255, 255, 255, 0.08) ',
            },
        },
        mantineTableHeadProps: {
            style: {
                borderRight: '1.5px solid rgba(255, 255, 255, 0.08) ',
            },
        },
        mantinePaperProps: {
            withBorder: true,
            shadow: 'xl',
            maw: maxWidth,
            className: GridStyles.dataTable,
        },
        onIsFullScreenChange: () =>
            setMaxWidth((width) => (width === '100vw' ? '97vw' : '100vw')),

        onColumnVisibilityChange: setColumnsShown,

        state: {
            isFullScreen: maxWidth == '100vw',
            columnVisibility: columnsShown,
        },

        renderTopToolbarCustomActions: () => (
            <BreadcrumbsForDrilldownSuites
                levels={properties.levels}
                setSearchQuery={properties.setSearchQuery}
            />
        ),

        renderDetailPanel: ({ row }) => {
            return (
                <DetailedViewForSuite
                    suite={row.original}
                    testRecord={properties.testRecord as DetailedTestRecord}
                />
            )
        },
    });
    return <>
        <MantineReactTable table={table} />
    </>;
}

function BreadcrumbsForDrilldownSuites(properties: {
    levels: SearchQuery['levels'];
    setSearchQuery: Dispatch<SetStateAction<SearchQuery>>;
}) {
    const insertMid = properties.levels.length > 6;
    const showLevels = insertMid
        ? properties.levels.slice(0, 3)
        : properties.levels;

    if (showLevels.length === 1) {
        return <>
            <Text size="xl" component="span">
                List of Suites
                <sub><Text size="xs" component="span" ml="xs">Click on any suites to view its tests/suites</Text></sub>
            </Text>
        </>
    }

    const menuOptions = insertMid ? properties.levels.slice(3, -3) : false;

    const onClickOptionNav = (index: number) => {
        const q = properties.levels ?? DEFAULT_QUERY;
        if (q.length - 1 === index) return;
        const nq = q.slice(0, index + 1);

        properties.setSearchQuery((_: SearchQuery) => ({
            ..._,
            levels: nq,
            parent: nq.at(-1)?.value ?? '',
        }));
    };

    const options = (
        index: number,
        level: { label: string; value: string },
    ) => (
        <Anchor
            variant="text"
            size="md"
            underline={
                index === properties.levels.length - 1 ? 'never' : 'hover'
            }
            c={index === properties.levels.length - 1 ? 'bright' : undefined}
            onClick={() =>
                properties.levels.length > 1 &&
                !(index === properties.levels.length - 1) &&
                onClickOptionNav(index)
            }
            key={level.value}
        >
            {level.label}
        </Anchor>
    );
    const comps = [];

    if (insertMid && menuOptions) {
        comps.push(
            <Menu shadow="xl" variant="light">
                <MenuTarget>
                    <ActionIcon variant="light">
                        <IconDots />
                    </ActionIcon>
                </MenuTarget>
                <MenuDropdown>
                    {menuOptions.map((option, index) => (
                        <MenuItem
                            key={option.value}
                            onClick={() =>
                                onClickOptionNav(showLevels.length + index)
                            }
                        >
                            {option.label}
                        </MenuItem>
                    ))}
                </MenuDropdown>
            </Menu>,
            properties.levels
                .slice(-3)
                .map((level, index) =>
                    options(
                        properties.levels.length - (showLevels.length - index),
                        level,
                    ),
                ),
        );
    }

    return (
        <Breadcrumbs>
            {showLevels.map((level, index) => options(index, level))}
            {...comps}
        </Breadcrumbs>
    );
}

export default function ListOfSuitesNonDynamic(properties: {
    testID?: string;
    mockSuites?: SuiteRecordDetails[];
    run?: DetailedTestRecord;
}): ReactNode {
    const run = properties.run;
    const [searchQuery, setSearchQuery] = useState<SearchQuery>(DEFAULT_QUERY);
    const suiteToQueryTests = searchQuery.levels.at(-1)?.value;

    const { suites } = useProcessedTestSuites(
        properties.mockSuites,
        properties.testID,
        run?.Tests,
    );

    const { tests } = useProcessedTestCases(
        properties.mockSuites,
        properties.testID,
        suiteToQueryTests,
        run?.Tests,
    );

    const { filteredSuites } = useFilteredSuites(searchQuery, suites, tests);

    return (
        <TableOfSuites
            testRecord={run as DetailedTestRecord}
            suites={filteredSuites}
            levels={searchQuery.levels}
            setSearchQuery={setSearchQuery}
            onParentFilter={(suiteID, suiteName) =>
                setSearchQuery((query) => ({
                    ...query,
                    parent: suiteID,
                    levels: [
                        ...query.levels,
                        { label: suiteName, value: suiteID },
                    ],
                }))
            }
        />
    );
}
