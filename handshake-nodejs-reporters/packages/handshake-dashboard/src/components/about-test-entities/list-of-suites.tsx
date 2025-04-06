/* eslint-disable unicorn/no-keyword-prefix */
import {
    ActionIcon,
    Anchor,
    Breadcrumbs,
    Menu,
    MenuDropdown,
    MenuItem,
    MenuTarget,
    rem,
    Skeleton,
    Tooltip,
} from '@mantine/core';
import { TimeRange } from 'components/timings/time-range';
import dayjs, { Dayjs } from 'dayjs';

import React, { Suspense, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { type SuiteRecordDetails } from 'types/test-entity-related';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import type {
    DetailedTestRecord,
    ParsedSuiteRecord,
} from 'types/parsed-records';
import { IconDots, IconFilter } from '@tabler/icons-react';
import '@mantine/core/styles.layer.css';
import useFilteredSuites, {
    DEFAULT_QUERY,
    SearchQuery,
} from 'hooks/filter-test-suites';
import { useProcessedTestSuites } from 'hooks/get-test-suites';
import TestStatusIcon from 'components/about-test-run/test-status';
import TestEntityStatusMetrics from './test-entity-status';
import {
    MantineReactTable,
    MRT_ColumnDef,
    useMantineReactTable,
} from 'mantine-react-table';
import 'mantine-react-table/styles.css';
import useTableConfigurationsForListOfSuites from 'hooks/get-saved-filters';
import CountUpNumber from 'components/counter';
import { DetailedViewForSuites } from './detailed-test-view';
import GridStyles from 'styles/data-table.module.css';

function TableOfSuites(properties: {
    suites: ParsedSuiteRecord[];
    started?: Dayjs;
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
                maxSize: 12,
                enableHiding: false,
                Cell: ({ row }) => {
                    return row.original.hasChildSuite ? (
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
                filterFn: 'equals',
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
                            relativeFrom={dayjs(properties?.started)}
                        />
                    );
                },
            },
            {
                accessorKey: 'Start Time',
                header: 'Start Time',
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <TimeRange
                            startTime={row.original.Started}
                            key={renderedRowIndex}
                            detailed
                            relativeFrom={dayjs(properties?.started)}
                        />
                    );
                },
            },
            {
                accessorKey: 'End Time',
                header: 'End Time',
                Cell: ({ row, renderedRowIndex }) => {
                    return (
                        <TimeRange
                            startTime={row.original.Ended}
                            key={renderedRowIndex}
                            detailed
                            relativeFrom={dayjs(properties?.started)}
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
                            endNumber={row.original.Contribution}
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
                Cell: ({ row, renderedRowIndex }) => (
                    <TestEntityStatusMetrics
                        key={renderedRowIndex}
                        passed={row.original.RollupValues[0]}
                        failed={row.original.RollupValues[1]}
                        skipped={row.original.RollupValues[2]}
                    />
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
        ],
        [properties.started],
    );
    const [maxWidth, setMaxWidth] = useState('98vw');

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
        mantineTableBodyCellProps: {
            style: {
                padding: '10px 6px',
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
            setMaxWidth((width) => (width === '100vw' ? '98vw' : '100vw')),

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
            return <DetailedViewForSuites suite={row.original} />;
        },
    });

    return <MantineReactTable table={table} />;
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
        return <></>;
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
            size="sm"
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
        <Breadcrumbs p="md">
            {showLevels.map((level, index) => options(index, level))}
            {...comps}
        </Breadcrumbs>
    );
}

export default function ListOfSuits(properties: {
    testID?: string;
    mockSuites?: SuiteRecordDetails[];
    run?: DetailedTestRecord;
}): ReactNode {
    const run = properties.run;

    const { suites } = useProcessedTestSuites(
        properties.mockSuites,
        properties.testID,
        run?.Tests,
    );

    const { filteredSuites, searchQuery, setSearchQuery } =
        useFilteredSuites(suites);

    return (
        <Suspense fallback={<Skeleton mt="55px" height={'40%'} />}>
            <TableOfSuites
                started={run?.Started}
                suites={filteredSuites}
                levels={searchQuery.levels}
                setSearchQuery={setSearchQuery}
                onParentFilter={(suiteID, suiteName) =>
                    setSearchQuery({
                        ...searchQuery,
                        parent: suiteID,
                        levels: [
                            ...searchQuery.levels,
                            { label: suiteName, value: suiteID },
                        ],
                    })
                }
            />
        </Suspense>
    );
}
