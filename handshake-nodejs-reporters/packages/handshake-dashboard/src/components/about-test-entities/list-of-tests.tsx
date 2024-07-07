import { ActionIcon, Badge, Center, rem, Skeleton } from '@mantine/core';
import type { RowsChangeData } from 'react-data-grid';
import DataGrid from 'react-data-grid';
import {
    jsonFeedForEntityLevelAssertions,
    jsonFeedForEntityLevelAttachments,
    jsonFeedForSuite,
    jsonFeedForTests,
    suiteDetailedPage,
} from 'components/links';
import {
    spawnConverterForAnsiToHTML,
    transformTestEntity,
} from 'extractors/transform-test-entity';
import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import GridStyles from 'styles/data-table.module.css';
import useSWRImmutable from 'swr/immutable';
import type {
    EntityLevelAssertions,
    EntityLevelAttachments,
    ErrorRecord,
    SuiteRecordDetails,
    TestRecordDetails,
} from 'types/test-entity-related';
import TestEntityStatus from './test-entity-status';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';
import CountUpNumber from 'components/counter';
import RedirectToTestEntity from './redirect-to-detailed-test-entity';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { ErrorsToShow } from './error-card';
import dayjs from 'dayjs';
import { IconCaretRightFilled } from '@tabler/icons-react';
import type { ParsedTestRecord } from 'types/parsed-records';
import type { PreviewImageFeed } from './image-carousel';
import { ShowImage } from './image-carousel';
import DetailedTestView from './detailed-test-view';

export default function ListOfTests(properties: {
    testID?: string;
    suiteID?: string;
}): ReactNode {
    const { data } = useSWRImmutable<TestRecordDetails[]>(
        properties.testID && properties.suiteID
            ? jsonFeedForTests(properties.testID, properties.suiteID)
            : undefined,
        () =>
            fetch(
                jsonFeedForTests(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );
    const { data: suite } = useSWRImmutable<SuiteRecordDetails>(
        properties.testID && properties.suiteID
            ? jsonFeedForSuite(properties.testID, properties.suiteID)
            : undefined,
        () =>
            fetch(
                jsonFeedForSuite(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );
    const {
        data: writtenAttachmentsForSuites,
        isLoading: simulateLoadingForAttachments,
    } = useSWRImmutable<EntityLevelAttachments>(
        properties.testID && properties.suiteID
            ? jsonFeedForEntityLevelAttachments(
                  properties.testID,
                  properties.suiteID,
              )
            : undefined,
        () =>
            fetch(
                jsonFeedForEntityLevelAttachments(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );

    const {
        data: assertionsAddedForThisSuite,
        isLoading: simulateLoadingForAssertions,
    } = useSWRImmutable<EntityLevelAssertions>(
        properties.testID && properties.suiteID
            ? jsonFeedForEntityLevelAssertions(
                  properties.testID,
                  properties.suiteID,
              )
            : undefined,
        () =>
            fetch(
                jsonFeedForEntityLevelAssertions(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );

    const [rows, setRows] = useState<ParsedTestRecord[]>([]);

    useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        setRows(
            (data ?? [])
                .filter((suite) => suite.standing !== 'RETRIED')
                .map((suite) => transformTestEntity(suite, converter)),
        );
    }, [data]);

    const router = useRouter();
    const [errorsToShow, setErrorsToShow] = useState<ErrorRecord[]>([]);
    const [imagePreview, setImagePreview] = useState<
        PreviewImageFeed | undefined
    >();

    function onRowsChange(
        rows: ParsedTestRecord[],
        { indexes }: RowsChangeData<ParsedTestRecord>,
    ) {
        const row = rows[indexes[0]];
        // skip this for the newly expanded rows.
        if (row.hasExpanded === undefined) return;

        if (row.hasExpanded) {
            rows.splice(indexes[0] + 1, 0, {
                ...row,
                Id: row.Id + '-', // NOTE: THIS
                hasExpanded: undefined,
            });
        } else {
            rows.splice(indexes[0] + 1, 1);
        }
        setRows(rows);
    }

    return (
        <>
            <DataGrid
                rows={rows}
                columns={[
                    {
                        key: 'Status-',
                        name: '',
                        width: 30,
                        minWidth: 30,
                        headerCellClass: GridStyles.cell,
                        renderCell: ({
                            row,
                            rowIdx,
                            tabIndex,
                            onRowChange,
                        }) => {
                            const entity_id = row.Id.slice(0, -1) ?? '';
                            if (row.hasExpanded === undefined)
                                return (
                                    <DetailedTestView
                                        testID={properties.testID}
                                        writtenAttachmentsForSuites={
                                            writtenAttachmentsForSuites &&
                                            writtenAttachmentsForSuites.written[
                                                entity_id
                                            ]
                                        }
                                        test={row}
                                        setImagePreview={
                                            setImagePreview as (
                                                feed: PreviewImageFeed,
                                            ) => undefined
                                        }
                                        attachmentsAreLoading={
                                            simulateLoadingForAttachments
                                        }
                                        assertions={
                                            assertionsAddedForThisSuite &&
                                            assertionsAddedForThisSuite[
                                                entity_id
                                            ]
                                        }
                                        assertionsAreLoading={
                                            simulateLoadingForAssertions
                                        }
                                    />
                                );
                            return (
                                <Center
                                    style={{
                                        width: '100%',
                                    }}
                                    key={rowIdx}
                                >
                                    <ActionIcon
                                        variant="subtle"
                                        tabIndex={tabIndex}
                                        size="sm"
                                        onClick={() =>
                                            onRowChange({
                                                ...row,
                                                hasExpanded: !row.hasExpanded,
                                            })
                                        }
                                    >
                                        <IconCaretRightFilled
                                            style={{
                                                width: rem(16),
                                                height: rem(16),
                                                transform: row.hasExpanded
                                                    ? 'rotate(90deg)'
                                                    : 'rotate(0deg)',
                                                transition:
                                                    'transform 0.3s ease',
                                            }}
                                            stroke={2.5}
                                        />
                                    </ActionIcon>
                                </Center>
                            );
                        },
                        cellClass(row) {
                            return row.hasExpanded === undefined
                                ? GridStyles.borderedDescCell
                                : GridStyles.cell;
                        },
                        colSpan(arguments_) {
                            return arguments_.type === 'ROW' &&
                                arguments_.row.hasExpanded === undefined
                                ? 8 // total number of cols we have in the table
                                : undefined;
                        },
                    },
                    {
                        key: 'Status',
                        name: 'Status',
                        width: 55,
                        headerCellClass: GridStyles.cell,
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
                        name: 'Type',
                        width: 62,
                        headerCellClass: GridStyles.cell,
                        renderCell: ({ row }) => (
                            <Center
                                style={{
                                    width: '100%',
                                }}
                            >
                                {row.type === 'SUITE' ? (
                                    <RedirectToTestEntity
                                        testID={properties.testID ?? ''}
                                        suiteID={row.Id}
                                        redirectTo={(_url) => router.push(_url)}
                                    />
                                ) : (
                                    <Badge color="pink" variant="light">
                                        TEST
                                    </Badge>
                                )}
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
                        headerCellClass: GridStyles.cell,
                        minWidth: 150,
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
                                    relativeFrom={dayjs(suite?.started)}
                                />
                            );
                        },
                        cellClass: GridStyles.cell,
                        headerCellClass: GridStyles.cell,
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
                    },
                    {
                        key: 'numberOfAssertions',
                        width: 120,
                        name: 'Assertions/Tests',
                        cellClass: GridStyles.cell,
                        headerCellClass: GridStyles.cell,
                        renderCell: ({ row, rowIdx }) => {
                            return (
                                <Center key={rowIdx}>
                                    <CountUpNumber
                                        size="sm"
                                        endNumber={
                                            row.type === 'TEST'
                                                ? row.numberOfAssertions
                                                : row.totalRollupValue
                                        }
                                    />
                                </Center>
                            );
                        },
                    },
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
                                    endNumber={row.numberOfErrors}
                                    size="sm"
                                    style={{
                                        textDecoration: row.numberOfErrors
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
                    },
                ]}
                rowKeyGetter={(row) => row.Id}
                onRowsChange={onRowsChange}
                headerRowHeight={35}
                rowHeight={(row) => (row.hasExpanded === undefined ? 320 : 45)}
                className={GridStyles.table}
                rowClass={(_, rowIndex) =>
                    rowIndex % 2 === 0 ? GridStyles.evenRow : GridStyles.oddRow
                }
                style={{
                    height: '100%',
                    width: '98.6vw',
                }}
                renderers={{
                    noRowsFallback: <Skeleton h={300} w={'98vw'} animate />,
                }}
                onCellClick={(cell) => {
                    switch (cell.column.key) {
                        case 'numberOfErrors': {
                            if (!cell.row.numberOfErrors) return;
                            setErrorsToShow(() => cell.row.errors);
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
            />
            <ErrorsToShow
                opened={errorsToShow.length > 0}
                onClose={() => {
                    setErrorsToShow(() => []);
                }}
                errorsToShow={errorsToShow}
            />
            <ShowImage
                feed={imagePreview}
                onClose={() => setImagePreview(undefined)}
            />
        </>
    );
}
