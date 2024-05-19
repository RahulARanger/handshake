import { Center } from '@mantine/core';
import DataGrid from 'react-data-grid';
import { jsonFeedForTests } from 'components/links';
import {
    spawnConverterForAnsiToHTML,
    transformTestEntity,
} from 'extractors/transform-test-entity';
import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import GridStyles from 'styles/data-table.module.css';
import useSWRImmutable from 'swr/immutable';
import type { TestRecordDetails } from 'types/test-entity-related';
import TestEntityStatus from './test-entity-status';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';
import CountUpNumber from 'components/counter';

export default function ListOfTests(properties: {
    testID?: string;
    suiteID?: string;
}): ReactNode {
    const { data, isLoading, error } = useSWRImmutable<TestRecordDetails[]>(
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
    const tests = useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        return (data ?? [])
            .filter((suite) => suite.standing !== 'RETRIED')
            .map((suite) => transformTestEntity(suite, converter));
    }, [data]);

    const toLoad = isLoading || data === undefined || error != undefined;

    return (
        <DataGrid
            rows={tests}
            columns={[
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
                                // relativeFrom={dayjs(run?.started)}
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
                    name: 'Assertions',
                    cellClass: GridStyles.cell,
                    headerCellClass: GridStyles.cell,
                    renderCell: ({ row, rowIdx }) => {
                        return (
                            <CountUpNumber
                                endNumber={row.numberOfAssertions}
                                key={rowIdx}
                            />
                        );
                    },
                },
            ]}
            rowKeyGetter={(row) => row.Id}
            headerRowHeight={35}
            rowHeight={45}
            className={GridStyles.table}
            rowClass={(_, rowIndex) =>
                rowIndex % 2 === 0 ? GridStyles.evenRow : GridStyles.oddRow
            }
        />
    );
}
