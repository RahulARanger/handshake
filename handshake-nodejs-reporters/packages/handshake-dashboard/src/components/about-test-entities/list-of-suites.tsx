import {
    Button,
    Center,
    Group,
    HoverCard,
    Skeleton,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    jsonFeedAboutTestRun,
    jsonFeedForListOfSuites,
    suiteDetailedPage,
} from 'components/links';
import { TimeRange } from 'components/timings/time-range';
import dayjs from 'dayjs';
import type { RowRecord } from 'extractors/transform-test-entity';
import transformSuiteEntity, {
    addRowsToSuiteStructure,
    spawnConverterForAnsiToHTML,
    topLevelSuites,
    transformSuitesStructure,
} from 'extractors/transform-test-entity';
import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';
import type { ErrorRecord } from 'types/test-entity-related';
import { type SuiteRecordDetails } from 'types/test-entity-related';
import type { TestRunRecord } from 'types/test-run-records';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import PlatformEntity, { DetailedPlatformVersions } from './platform-entity';
import type { ParsedSuiteRecord } from 'types/parsed-records';
import { IconTrendingDown2 } from '@tabler/icons-react';
import GridStyles from 'styles/data-table.module.css';
import type { ColumnOrColumnGroup, Column } from 'react-data-grid';
import { TreeDataGrid } from 'react-data-grid';
import { pick, groupBy as rowGrouper, sumBy, uniqBy } from 'lodash-es';
import clsx from 'clsx';
import { getStandingFromList } from 'extractors/transform-run-record';
import TestEntityStatus, {
    TestEntityStatusMetrics,
} from './test-entity-status';
import CountUpNumber from 'components/counter';
import { useDisclosure } from '@mantine/hooks';
import { ErrorsToShow } from './error-card';
import RedirectToTestEntity from './redirect-to-detailed-test-entity';
import { useRouter } from 'next/router';

export default function ListOfSuits(properties: {
    testID?: string;
}): ReactNode {
    const router = useRouter();
    const {
        data: run,
        isLoading: runFeedLoading,
        error: runFeedError,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );

    const { data, isLoading, error } = useSWRImmutable<SuiteRecordDetails[]>(
        properties.testID
            ? jsonFeedForListOfSuites(properties.testID)
            : undefined,
        () =>
            fetch(jsonFeedForListOfSuites(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );

    const suites = useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        return (data ?? [])
            .filter((suite) => suite.standing !== 'RETRIED')
            .map((suite) =>
                transformSuiteEntity(suite, run?.tests ?? 0, converter),
            );
    }, [run?.tests, data]);

    const [expandedGroupIds, setExpandedGroupIds] = useState(
        (): ReadonlySet<unknown> => new Set<unknown>([]),
    );

    const toLoad =
        runFeedLoading ||
        isLoading ||
        error !== undefined ||
        runFeedError !== undefined ||
        run === undefined ||
        data === undefined;

    const [parsedSuites, setParsedSuites] = useState<RowRecord[]>([]);

    useMemo(
        () => setParsedSuites(toLoad ? [] : transformSuitesStructure(suites)),
        [suites, toLoad], // NOTE: do not remove toLoad from dependency, else react will not re-calculate once data is ready
    );

    const [opened, { open, close }] = useDisclosure(false);
    const [errorsToShow, setErrorsToShow] = useState<ErrorRecord[]>([]);
    const [groupedRowsByFile, setGroupedRowsByFile] = useState<{
        records: ParsedSuiteRecord[];
        title: string;
    }>({ records: [], title: '' });

    return (
        <>
            <TreeDataGrid
                columns={
                    [
                        {
                            key: 'Status-',
                            name: 'Status',
                            width: 52,
                            headerCellClass: GridStyles.cell,
                            renderGroupCell: (rows) => {
                                return (
                                    <Center
                                        style={{
                                            height: '100%',
                                        }}
                                    >
                                        <TestEntityStatus
                                            status={getStandingFromList(
                                                rows.childRows.map(
                                                    (row) => row.Status,
                                                ),
                                            )}
                                        />
                                    </Center>
                                );
                            },
                            renderCell: ({ row, rowIdx }) => (
                                <Center
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    <TestEntityStatus
                                        status={row.Status}
                                        key={rowIdx}
                                    />
                                </Center>
                            ),
                            cellClass: GridStyles.cell,
                            summaryCellClass: GridStyles.cell,
                        },
                        {
                            key: 'Id',
                            name: 'Expand',
                            width: 58,
                            headerCellClass: GridStyles.cell,
                            renderCell: ({ row }) => (
                                <Center
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    <RedirectToTestEntity
                                        testID={properties.testID ?? ''}
                                        suiteID={row.Id}
                                        redirectTo={(_url) => router.push(_url)}
                                    />
                                </Center>
                            ),
                            cellClass: clsx(
                                GridStyles.FHCell,
                                GridStyles.clickable,
                            ),
                        },
                        {
                            key: 'Title',
                            name: 'Title',
                            resizable: true,
                            cellClass: GridStyles.cell,
                            minWidth: 150,
                            headerCellClass: GridStyles.cell,
                            renderCell: ({ row, rowIdx, tabIndex }) => {
                                return (
                                    <HoverCard
                                        width={280}
                                        shadow="md"
                                        openDelay={500}
                                    >
                                        <HoverCard.Target>
                                            <Group
                                                wrap="nowrap"
                                                style={{ width: '100%' }}
                                                key={rowIdx}
                                                align="flex-start"
                                                justify="flex-start"
                                            >
                                                {row.hasChildSuite ||
                                                !row.Parent ? (
                                                    <></>
                                                ) : (
                                                    <IconTrendingDown2
                                                        color="gray"
                                                        size={18}
                                                        strokeWidth={2.5}
                                                    />
                                                )}

                                                {row.hasChildSuite ? (
                                                    <Button
                                                        tabIndex={tabIndex}
                                                        color="gray.4"
                                                        pl={1}
                                                        variant="subtle"
                                                        size="sm"
                                                        fw="normal"
                                                        onClick={() =>
                                                            row.hasChildSuite &&
                                                            setParsedSuites(
                                                                addRowsToSuiteStructure(
                                                                    parsedSuites,
                                                                    row.Id,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        {row.Title}
                                                    </Button>
                                                ) : (
                                                    <Text size="sm" c="gray.4">
                                                        {row.Title}
                                                    </Text>
                                                )}
                                            </Group>
                                        </HoverCard.Target>
                                        <HoverCard.Dropdown>
                                            <Group
                                                wrap="nowrap"
                                                align="center"
                                                justify="space-between"
                                            >
                                                <Text size="sm">
                                                    {row.Title}
                                                </Text>
                                                <RedirectToTestEntity
                                                    testID={
                                                        properties.testID ?? ''
                                                    }
                                                    suiteID={row.Id}
                                                    redirectTo={(_url) =>
                                                        router.push(_url)
                                                    }
                                                />
                                            </Group>
                                            <Text
                                                size="xs"
                                                fs="italic"
                                                c="dimmed"
                                                mt={5}
                                            >
                                                you can also double click to
                                                quickly redirect
                                            </Text>
                                        </HoverCard.Dropdown>
                                    </HoverCard>
                                );
                            },
                        },
                        {
                            key: 'File',
                            name: 'File',
                            width: 150,
                            resizable: true,
                            cellClass: clsx(GridStyles.GCell, GridStyles.cell),
                            headerCellClass: GridStyles.cell,
                            renderGroupCell: ({ groupKey, tabIndex }) => (
                                <Tooltip
                                    label={groupKey as string}
                                    color="indigo"
                                    openDelay={500}
                                >
                                    <Button
                                        size="sm"
                                        className={GridStyles.cell}
                                        tabIndex={tabIndex}
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                        }}
                                        p="sm"
                                        color="gray"
                                        td="underline"
                                        variant="subtle"
                                    >
                                        {(groupKey as string).slice(
                                            (groupKey as string).lastIndexOf(
                                                '\\',
                                            ) + 1,
                                        )}
                                    </Button>
                                </Tooltip>
                            ),
                        },
                        {
                            key: 'Started',
                            name: 'Range',
                            width: 190,
                            renderCell: ({ row, rowIdx }) => {
                                return (
                                    <TimeRange
                                        startTime={row.Started}
                                        endTime={row.Ended}
                                        key={rowIdx}
                                        detailed
                                        relativeFrom={dayjs(run?.started)}
                                    />
                                );
                            },
                            cellClass: GridStyles.cell,
                            headerCellClass: GridStyles.cell,
                            renderGroupCell: (rows) => {
                                return (
                                    <div className={GridStyles.FHCell}>
                                        <TimeRange
                                            startTime={
                                                rows.childRows.at(0)?.Started ??
                                                dayjs()
                                            }
                                            endTime={
                                                rows.childRows.at(-1)?.Ended ??
                                                dayjs()
                                            }
                                            detailed
                                            relativeFrom={dayjs(run?.started)}
                                        />
                                    </div>
                                );
                            },
                        },
                        {
                            key: 'Duration',
                            width: 120,
                            name: 'Duration',
                            renderCell: ({ row, rowIdx }) => {
                                return (
                                    <HumanizedDuration
                                        duration={row.Duration}
                                        key={rowIdx}
                                    />
                                );
                            },
                            cellClass: GridStyles.cell,
                            headerCellClass: GridStyles.cell,
                            renderGroupCell: (rows) => {
                                const started =
                                    rows.childRows.at(0)?.Started ?? dayjs();
                                const ended =
                                    rows.childRows.at(-1)?.Ended ?? dayjs();

                                return (
                                    <div className={GridStyles.FHCell}>
                                        <HumanizedDuration
                                            duration={dayjs.duration({
                                                milliseconds:
                                                    ended.diff(started),
                                            })}
                                        />
                                    </div>
                                );
                            },
                        },
                        {
                            name: 'Metrics',
                            headerCellClass: GridStyles.cell,
                            key: 'metrics',
                            width: 'max-content',
                            children: [
                                {
                                    key: 'numberOfErrors',
                                    name: 'Errors',
                                    width: 63,
                                    headerCellClass: GridStyles.cell,
                                    cellClass: (row) =>
                                        clsx(
                                            row.Status === 'FAILED'
                                                ? clsx(
                                                      GridStyles.redRow,
                                                      GridStyles.clickable,
                                                  )
                                                : undefined,
                                            GridStyles.cell,
                                        ),
                                    renderCell: ({ row, rowIdx }) => {
                                        return (
                                            <CountUpNumber
                                                smallWhenZero
                                                endNumber={row.numberOfErrors}
                                                style={{
                                                    textDecoration:
                                                        row.numberOfErrors
                                                            ? 'underline'
                                                            : '',
                                                    cursor: row.numberOfErrors
                                                        ? 'pointer'
                                                        : '',
                                                }}
                                                size="sm"
                                                key={rowIdx}
                                            />
                                        );
                                    },
                                    renderGroupCell: (rows) => (
                                        <CountUpNumber
                                            size="sm"
                                            smallWhenZero
                                            endNumber={sumBy(
                                                topLevelSuites(rows.childRows),
                                                'numberOfErrors',
                                            )}
                                            cn={GridStyles.FHCell}
                                        />
                                    ),
                                },
                                {
                                    key: 'totalRollupValue',
                                    name: 'Tests',
                                    width: 63,

                                    cellClass: GridStyles.cell,
                                    headerCellClass: GridStyles.cell,
                                    renderGroupCell: (rows) => (
                                        <CountUpNumber
                                            endNumber={sumBy(
                                                topLevelSuites(rows.childRows),
                                                'totalRollupValue',
                                            )}
                                            cn={GridStyles.FHCell}
                                        />
                                    ),
                                },
                                {
                                    key: 'Entities',
                                    name: 'Entities',
                                    width: 110,
                                    cellClass: GridStyles.cell,
                                    headerCellClass: GridStyles.cell,
                                    renderCell: ({ row, rowIdx }) => (
                                        <TestEntityStatusMetrics
                                            key={rowIdx}
                                            passed={row.RollupValues[0]}
                                            failed={row.RollupValues[1]}
                                            skipped={row.RollupValues[2]}
                                        />
                                    ),
                                    renderGroupCell: (rows) => (
                                        <TestEntityStatusMetrics
                                            cn={GridStyles.FHCell}
                                            passed={sumBy(
                                                topLevelSuites(rows.childRows),
                                                'RollupValues.0',
                                            )}
                                            failed={sumBy(
                                                topLevelSuites(rows.childRows),
                                                'RollupValues.1',
                                            )}
                                            skipped={sumBy(
                                                topLevelSuites(rows.childRows),
                                                'RollupValues.2',
                                            )}
                                        />
                                    ),
                                },
                                {
                                    key: 'Contribution',
                                    name: 'Contri.',
                                    width: 66,
                                    cellClass: GridStyles.cell,
                                    headerCellClass: GridStyles.cell,
                                    renderCell: ({ row }) => (
                                        <CountUpNumber
                                            endNumber={row.Contribution}
                                            suffix="%"
                                            size="xs"
                                            decimalPoints={2}
                                        />
                                    ),

                                    renderGroupCell: (rows) => (
                                        <CountUpNumber
                                            endNumber={sumBy(
                                                topLevelSuites(rows.childRows),
                                                'Contribution',
                                            )}
                                            cn={GridStyles.FHCell}
                                            suffix="%"
                                            decimalPoints={2}
                                        />
                                    ),
                                },
                            ],
                        },
                        {
                            key: 'entityName',
                            name: 'Platform',
                            width: 110,
                            renderCell: ({ row, rowIdx }) => {
                                return (
                                    <PlatformEntity
                                        entityNames={[row.entityName]}
                                        size="sm"
                                        key={rowIdx}
                                    />
                                );
                            },
                            renderGroupCell: (rows) => {
                                return (
                                    <Button
                                        variant="subtle"
                                        color="violet"
                                        tabIndex={rows.tabIndex}
                                        w={'100%'}
                                        onClick={() => {
                                            setGroupedRowsByFile(() => ({
                                                records: uniqBy(
                                                    rows.childRows,
                                                    'simplified',
                                                ).map((row) =>
                                                    pick(row, [
                                                        'entityName',
                                                        'entityVersion',
                                                        'simplified',
                                                    ]),
                                                ) as ParsedSuiteRecord[],
                                                title: `Platforms for File: ${rows.childRows?.at(0)?.File}`,
                                            }));
                                            open();
                                        }}
                                    >
                                        <PlatformEntity
                                            entityNames={uniqBy(
                                                rows.childRows,
                                                'entityName',
                                            ).map(
                                                (entity) => entity.entityName,
                                            )}
                                            c={clsx(
                                                GridStyles.clickable,
                                                GridStyles.FHCell,
                                            )}
                                            size="sm"
                                            moveRight
                                        />
                                    </Button>
                                );
                            },
                            cellClass: clsx(
                                GridStyles.cell,
                                GridStyles.clickable,
                            ),
                            headerCellClass: GridStyles.cell,
                        },
                    ] as Array<
                        Column<ParsedSuiteRecord, unknown> &
                            ColumnOrColumnGroup<ParsedSuiteRecord, unknown>
                    >
                }
                rows={parsedSuites}
                rowKeyGetter={(row) => row.Id}
                headerRowHeight={35}
                rowHeight={45}
                className={GridStyles.table}
                rowClass={(_, rowIndex) =>
                    rowIndex % 2 === 0 ? GridStyles.evenRow : GridStyles.oddRow
                }
                style={{
                    height: '100%',
                    width: '98.6vw',
                }}
                groupBy={['File']}
                rowGrouper={rowGrouper}
                renderers={{
                    noRowsFallback: <Skeleton h={300} w={'98vw'} animate />,
                }}
                expandedGroupIds={expandedGroupIds}
                onExpandedGroupIdsChange={setExpandedGroupIds}
                onCellClick={(cell) => {
                    switch (cell.column.key) {
                        case 'numberOfErrors': {
                            if (!cell.row.numberOfErrors) return;
                            setErrorsToShow(() => cell.row.errors);
                            open();
                            break;
                        }
                        case 'entityName': {
                            setGroupedRowsByFile(() => ({
                                records: [
                                    pick(cell.row, [
                                        'entityName',
                                        'entityVersion',
                                        'simplified',
                                    ]) as ParsedSuiteRecord,
                                ],
                                title: `"${cell.row.Title.slice(0, 30) + (cell.row.Title.length > 10 ? '...' : '')}" ran on ${cell.row.entityName}`,
                            }));
                            open();
                            break;
                        }
                        case 'Id': {
                            router.push(
                                suiteDetailedPage(
                                    properties.testID ?? '',
                                    cell.row.Id,
                                ),
                            );
                            break;
                        }
                    }
                }}
                onCellDoubleClick={(cell) => {
                    switch (cell.column.key) {
                        case 'Title': {
                            router.push(
                                suiteDetailedPage(
                                    properties.testID ?? '',
                                    cell.row.Id,
                                ),
                            );
                            break;
                        }
                    }
                }}
            />
            <ErrorsToShow
                opened={opened && errorsToShow.length > 0}
                onClose={() => {
                    close();
                    setErrorsToShow(() => []);
                }}
                errorsToShow={errorsToShow}
            />
            <DetailedPlatformVersions
                title={groupedRowsByFile.title}
                records={groupedRowsByFile.records}
                opened={opened && errorsToShow.length === 0}
                onClose={() => {
                    close();
                    setGroupedRowsByFile({ records: [], title: '' });
                }}
            />
        </>
    );
}
