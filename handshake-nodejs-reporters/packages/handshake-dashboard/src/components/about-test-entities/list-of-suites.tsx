import {
    ActionIcon,
    Anchor,
    Breadcrumbs,
    Group,
    Input,
    Menu,
    MenuDropdown,
    MenuItem,
    MenuTarget,
    MultiSelect,
    Paper,
    rem,
    Skeleton,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { TimeRange } from 'components/timings/time-range';
import dayjs, { Dayjs } from 'dayjs';

import React, { Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { type SuiteRecordDetails } from 'types/test-entity-related';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import type {
    DetailedTestRecord,
    ParsedSuiteRecord,
} from 'types/parsed-records';
import {
    IconClearAll,
    IconDots,
    IconFilter,
    IconFilterSearch,
    IconSearch,
    IconSquareRoundedArrowRightFilled,
} from '@tabler/icons-react';
import TestEntityStatus from './test-entity-status';
import { statusOfEntity } from 'types/session-records';
import { DataTable } from 'mantine-datatable';
import '@mantine/core/styles.layer.css';
import 'mantine-datatable/styles.layer.css';
import useFilteredSuites, {
    DEFAULT_QUERY,
    SearchQuery,
} from 'hooks/filter-test-suites';
import { useProcessedTestSuites } from 'hooks/get-test-suites';

function SearchBar(properties: {
    setSearchQuery: React.Dispatch<React.SetStateAction<SearchQuery>>;
}) {
    const [toSearch, setToSearch] = useState<string>('');

    return (
        <Group justify="flex-start">
            <Input
                leftSection={<IconFilterSearch size={13} strokeWidth={2.5} />}
                placeholder="Search Suites"
                value={toSearch}
                onChange={(event) => setToSearch(event.currentTarget.value)}
                rightSection={
                    toSearch === '' ? undefined : (
                        <Input.ClearButton onClick={() => setToSearch('')} />
                    )
                }
                rightSectionPointerEvents="auto"
            />

            <ActionIcon
                onClick={() =>
                    properties.setSearchQuery((_: SearchQuery) => {
                        return {
                            ..._,
                            search: toSearch,
                            parent: _.parent,
                        };
                    })
                }
            >
                <IconSearch size={13} strokeWidth={2.5} />
            </ActionIcon>
            <ActionIcon
                onClick={() => properties.setSearchQuery(DEFAULT_QUERY)}
            >
                <IconClearAll size={13} strokeWidth={2.5} />
            </ActionIcon>
        </Group>
    );
}

function FilterStatus(properties: {
    onStatusChange: (_: statusOfEntity[]) => void;
}) {
    const [statusSelected, onStatusSelected] = useState<string[]>([]);

    return (
        <Stack>
            <Text size="sm">Select Status for filtering:</Text>
            <Group wrap="nowrap">
                <MultiSelect
                    data={[
                        'Passed',
                        'Failed',
                        'Skipped',
                        'XFailed',
                        'XPassed',
                    ].map((label) => ({
                        label,
                        value: label.toUpperCase(),
                    }))}
                    value={statusSelected}
                    onChange={onStatusSelected}
                    comboboxProps={{ withinPortal: false }}
                    placeholder="Select Status"
                    multiple
                    clearable
                />
                <Tooltip
                    label="Click on this button to set the filter"
                    defaultOpened
                    color="orange"
                    arrowPosition="center"
                    position="bottom"
                    offset={13}
                    withArrow
                    withinPortal
                >
                    <ActionIcon
                        variant="light"
                        onClick={() =>
                            properties.onStatusChange(
                                statusSelected as statusOfEntity[],
                            )
                        }
                    >
                        <IconSquareRoundedArrowRightFilled
                            style={{ width: rem(15), height: rem(15) }}
                        />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Stack>
    );
}

function TableOfSuites(properties: {
    suites: ParsedSuiteRecord[];
    started?: Dayjs;
    statusFiltered?: statusOfEntity[];
    onParentFilter: (parentID: string, suiteName: string) => void;
    onStatusChange: (modifiedStatus: statusOfEntity[]) => void;
}) {
    return (
        <Paper withBorder shadow="xl">
            <DataTable
                withTableBorder
                withRowBorders
                withColumnBorders
                striped
                highlightOnHover
                records={properties.suites}
                pinFirstColumn
                columns={[
                    {
                        accessor: 'hasChildSuite',
                        title: '',
                        render: (row) => {
                            return row.hasChildSuite ? (
                                <ActionIcon
                                    variant="light"
                                    onClick={() =>
                                        properties.onParentFilter(
                                            row.Id,
                                            row.Title,
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
                            ) : (
                                <></>
                            );
                        },
                        textAlign: 'center',
                    },
                    {
                        accessor: 'Status',
                        render: (row, rowIndex) => (
                            <TestEntityStatus
                                status={row.Status}
                                key={rowIndex}
                            />
                        ),
                        textAlign: 'center',
                        filter: (
                            <FilterStatus
                                onStatusChange={properties.onStatusChange}
                            />
                        ),
                        filtering:
                            properties.statusFiltered &&
                            properties.statusFiltered.length > 0,
                    },
                    {
                        accessor: 'Title',
                        width: 150,
                        ellipsis: true,
                    },
                    {
                        accessor: 'File',
                    },
                    {
                        accessor: 'Range',
                        render: (row, rowIndex) => {
                            return (
                                <TimeRange
                                    startTime={row.Started}
                                    endTime={row.Ended}
                                    key={rowIndex}
                                    detailed
                                    relativeFrom={dayjs(properties?.started)}
                                />
                            );
                        },
                    },
                    {
                        accessor: 'Start Time',
                        render: (row, rowIndex) => {
                            return (
                                <TimeRange
                                    startTime={row.Started}
                                    key={rowIndex}
                                    detailed
                                    relativeFrom={dayjs(properties?.started)}
                                />
                            );
                        },
                    },
                    {
                        accessor: 'End Time',
                        render: (row, rowIndex) => {
                            return (
                                <TimeRange
                                    startTime={row.Ended}
                                    key={rowIndex}
                                    detailed
                                    relativeFrom={dayjs(properties?.started)}
                                />
                            );
                        },
                    },
                    {
                        accessor: 'Duration',
                        render: (row, rowIndex) => {
                            return (
                                <HumanizedDuration
                                    duration={row.Duration}
                                    key={rowIndex}
                                />
                            );
                        },
                    },
                    { accessor: 'totalRollupValue', title: 'Tests' },
                ]}
            />
        </Paper>
    );
}

function BreadcrumbsForDrilldownSuites(properties: {
    searchQuery: SearchQuery;
    setSearchQuery: (_: SearchQuery) => void;
}) {
    const insertMid = properties.searchQuery.levels.length > 6;
    const showLevels = insertMid
        ? properties.searchQuery.levels.slice(0, 3)
        : properties.searchQuery.levels;

    if (showLevels.length === 1) {
        return <></>;
    }

    const menuOptions = insertMid
        ? properties.searchQuery.levels.slice(3, -3)
        : false;

    const onClickOptionNav = (index: number) => {
        const q = properties.searchQuery.levels ?? DEFAULT_QUERY;
        if (q.length - 1 === index) return;
        const nq = q.slice(0, index + 1);

        properties.setSearchQuery({
            ...properties.searchQuery,
            levels: nq,
            parent: nq.at(-1)?.value ?? '',
        });
    };

    const options = (
        index: number,
        level: { label: string; value: string },
    ) => (
        <Anchor
            variant="text"
            size="sm"
            underline={
                index === properties.searchQuery.levels.length - 1
                    ? 'never'
                    : 'hover'
            }
            c={
                index === properties.searchQuery.levels.length - 1
                    ? 'bright'
                    : undefined
            }
            onClick={() =>
                properties.searchQuery.levels.length > 1 &&
                !(index === properties.searchQuery.levels.length - 1) &&
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
            properties.searchQuery.levels
                .slice(-3)
                .map((level, index) =>
                    options(
                        properties.searchQuery.levels.length -
                            (showLevels.length - index),
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
        <Stack>
            <Group justify="space-between">
                <SearchBar setSearchQuery={setSearchQuery} />
                {searchQuery.levels === undefined ? (
                    <></>
                ) : (
                    <BreadcrumbsForDrilldownSuites
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                )}
            </Group>
            <Suspense fallback={<Skeleton height={'40%'} />}>
                <TableOfSuites
                    started={run?.Started}
                    suites={filteredSuites}
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
                    onStatusChange={(status: statusOfEntity[]) => {
                        setSearchQuery({
                            ...searchQuery,
                            status,
                        });
                    }}
                    statusFiltered={searchQuery.status}
                />
            </Suspense>
        </Stack>
    );
}
