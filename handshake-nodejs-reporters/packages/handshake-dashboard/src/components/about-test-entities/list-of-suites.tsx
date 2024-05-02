import {
    Badge,
    Button,
    Center,
    Grid,
    Group,
    Modal,
    Paper,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    jsonFeedAboutTestRun,
    jsonFeedForListOfSuites,
} from 'components/links';
import { TimeRange } from 'components/timings/time-range';
import dayjs from 'dayjs';
import type { RowRecord } from 'extractors/transform-test-entity';
import transformTestEntity, {
    addRowsToSuiteStructure,
    spawnConverterForAnsiToHTML,
    transformSuitesStructure,
} from 'extractors/transform-test-entity';
import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';
import type { ErrorRecord } from 'types/test-entity-related';
import { type SuiteRecordDetails } from 'types/test-entity-related';
import type { TestRunRecord } from 'types/test-run-records';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import PlatformEntity from './platform-entity';
import type { possibleEntityNames } from 'types/session-records';
import type { ParsedSuiteRecord } from 'types/parsed-records';
import { IconTrendingDown2 } from '@tabler/icons-react';
import GridStyles from 'styles/data-table.module.css';
import type { ColumnOrColumnGroup, Column } from 'react-data-grid';
import { TreeDataGrid } from 'react-data-grid';
import { groupBy as rowGrouper, sumBy } from 'lodash-es';
import clsx from 'clsx';
import { getStandingFromList } from 'extractors/transform-run-record';
import TestEntityStatus from './test-entity-status';
import CountUpNumber from 'components/counter';
import { useDisclosure } from '@mantine/hooks';
import ErrorCard from './error-card';

export default function ListOfSuits(properties: {
    testID?: string;
}): ReactNode {
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
        return (data ?? []).map((suite) =>
            transformTestEntity(suite, run?.tests ?? 0, converter),
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

    return (
        <>
            <TreeDataGrid
                columns={
                    [
                        {
                            key: 'Status',
                            name: 'Status',
                            width: 55,
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
                            key: 'Title',
                            name: 'Title',
                            resizable: true,
                            cellClass: GridStyles.cell,
                            minWidth: 150,
                            headerCellClass: GridStyles.cell,
                            renderCell: ({ row, rowIdx, tabIndex }) => {
                                return (
                                    <Group
                                        wrap="nowrap"
                                        style={{ width: '100%' }}
                                        key={rowIdx}
                                        align="flex-start"
                                        justify="flex-start"
                                    >
                                        {row.hasChildSuite || !row.Parent ? (
                                            <></>
                                        ) : (
                                            <IconTrendingDown2
                                                color="gray"
                                                size={18}
                                                strokeWidth={2.5}
                                            />
                                        )}
                                        <Tooltip
                                            label={row.Title}
                                            color="orange"
                                        >
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
                                                <Text size="sm" color="gray.4">
                                                    {row.Title}
                                                </Text>
                                            )}
                                        </Tooltip>
                                    </Group>
                                );
                            },
                        },
                        {
                            key: 'File',
                            name: 'File',
                            width: 150,
                            resizable: true,
                            cellClass: GridStyles.cell,
                            headerCellClass: GridStyles.cell,
                            renderGroupCell: ({ groupKey }) => (
                                <Tooltip
                                    label={groupKey as string}
                                    color="violet"
                                >
                                    <Button
                                        size="sm"
                                        className={GridStyles.cell}
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                        }}
                                        p="sm"
                                        color="violet"
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
                                    width: 65,
                                    headerCellClass: GridStyles.cell,
                                    cellClass: (row) =>
                                        clsx(
                                            row.Status === 'FAILED'
                                                ? GridStyles.redRow
                                                : undefined,
                                            GridStyles.cell,
                                        ),
                                    renderCell: ({ row, rowIdx }) => {
                                        return (
                                            <CountUpNumber
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
                                                key={rowIdx}
                                            />
                                        );
                                    },
                                    renderGroupCell: (rows) => (
                                        <CountUpNumber
                                            endNumber={sumBy(
                                                rows.childRows,
                                                'numberOfErrors',
                                            )}
                                            cn={GridStyles.FHCell}
                                        />
                                    ),
                                },
                                {
                                    key: 'totalRollupValue',
                                    name: 'Tests',
                                    width: 65,

                                    cellClass: GridStyles.cell,
                                    headerCellClass: GridStyles.cell,
                                    renderGroupCell: (rows) => (
                                        <CountUpNumber
                                            endNumber={sumBy(
                                                rows.childRows,
                                                'totalRollupValue',
                                            )}
                                            cn={GridStyles.FHCell}
                                        />
                                    ),
                                },
                                {
                                    key: 'totalRollupValue',
                                    name: 'Entities',
                                    width: 110,
                                    cellClass: GridStyles.cell,
                                    headerCellClass: GridStyles.cell,
                                    renderCell: ({ row, rowIdx }) => {
                                        return (
                                            <Group
                                                gap={2}
                                                wrap="nowrap"
                                                key={rowIdx}
                                                justify="space-between"
                                            >
                                                <Tooltip
                                                    color="green.8"
                                                    label="Passed"
                                                >
                                                    <Badge
                                                        color="green.6"
                                                        size="sm"
                                                        variant="light"
                                                    >
                                                        {row.RollupValues[0]}
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip
                                                    color="red.8"
                                                    label="Failed"
                                                >
                                                    <Badge
                                                        variant="light"
                                                        color="red.9"
                                                        size="sm"
                                                    >
                                                        {row.RollupValues[1]}
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip
                                                    color="yellow.9"
                                                    label="Skipped"
                                                >
                                                    <Badge
                                                        color="yellow.9"
                                                        size="sm"
                                                        variant="light"
                                                    >
                                                        {row.RollupValues[2]}
                                                    </Badge>
                                                </Tooltip>
                                            </Group>
                                        );
                                    },
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
                                            decimalPoints={2}
                                        />
                                    ),

                                    renderGroupCell: (rows) => (
                                        <CountUpNumber
                                            endNumber={sumBy(
                                                rows.childRows,
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
                            width: 120,
                            renderCell: ({ row, rowIdx }) => {
                                return (
                                    <PlatformEntity
                                        entityName={
                                            row.entityName as possibleEntityNames
                                        }
                                        size="sm"
                                        key={rowIdx}
                                        entityVersion={row.entityVersion}
                                        simplified={row.simplified}
                                    />
                                );
                            },
                            cellClass: GridStyles.cell,
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
                expandedGroupIds={expandedGroupIds}
                onExpandedGroupIdsChange={setExpandedGroupIds}
                onCellClick={(cell) => {
                    switch (cell.column.key) {
                        case 'numberOfErrors': {
                            setErrorsToShow(() => cell.row.errors);
                            open();
                            break;
                        }
                    }
                }}
            />
            <Modal
                opened={opened}
                onClose={close}
                title={`Errors (${errorsToShow.length})`}
                centered
                size="lg"
            >
                <Stack p="sm">
                    {errorsToShow.map((error, index) => (
                        <ErrorCard error={error} key={index} />
                    ))}
                </Stack>
            </Modal>
        </>
    );
}

// function SuiteDetailedView(properties: {
//     record: ParsedSuiteRecord;
// }): ReactNode {
//     const record = properties.record;
//     return (
//         <Card withBorder radius="md" shadow="xl">
//             <Card.Section withBorder p="xs">
//                 <Text size="sm">Description</Text>
//             </Card.Section>
//             {record.Desc ? (
//                 <Card.Section p="sm" px="sm">
//                     <Text size="sm">{record.Desc}</Text>
//                 </Card.Section>
//             ) : (
//                 <></>
//             )}

//             <Card.Section p="xs">
//                 {record.Desc ? (
//                     <Text size="sm" c="dimmed">
//                         {record.Desc}
//                     </Text>
//                 ) : (
//                     <Text size="xs" c="dimmed" fs="italic">
//                         No Description Provided
//                     </Text>
//                 )}
//             </Card.Section>
//             <Card.Section withBorder p="xs">
//                 <Group justify="space-between" wrap="nowrap">
//                     <Text size="sm">Errors</Text>
//                     <Badge color="red.9" variant="light" size="sm">
//                         {record.numberOfErrors}
//                     </Badge>
//                 </Group>
//             </Card.Section>
//             <Card.Section p="xs">
// {record.errors.length > 0 ? (
//     <Grid p="sm">
//         {record.errors.map((error, index) => (
//             <Grid.Col span="content" key={index}>
//                 <ErrorCard error={error} key={index} />
//             </Grid.Col>
//         ))}
//     </Grid>
// ) : (
//     <Alert color="green" title="No Errors Found" />
// )}
//             </Card.Section>
//         </Card>
//     );
// }
