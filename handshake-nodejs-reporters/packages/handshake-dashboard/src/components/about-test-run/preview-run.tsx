import { Card, rem, Skeleton, Text } from '@mantine/core';
import {
    jsonFeedAboutTestRun,
    jsonFeedForOverviewOfTestRun,
} from 'components/links';
import {
    OverviewOfEntities,
    TransformedOverviewOfEntities,
    transformOverviewFeed,
} from 'extractors/transform-run-record';
import React, { ReactNode, useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { DataTable } from 'mantine-datatable';
import dayjs, { Dayjs } from 'dayjs';
import RelativeDate from 'components/timings/relative-date';
import { TestRunRecord } from 'types/test-run-records';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import PassedRate from './passed-rate';

function PreviewTestSuites(properties: { testID?: string }): ReactNode {
    const {
        data: run,
        isLoading: runFeedLoading,
        error: runFeedError,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : null,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const {
        data: rawFeed,
        isLoading,
        error,
    } = useSWRImmutable<OverviewOfEntities>(
        properties.testID
            ? jsonFeedForOverviewOfTestRun(properties.testID)
            : null,
        () =>
            fetch(
                jsonFeedForOverviewOfTestRun(properties.testID as string),
            ).then(async (response) => response.json()),
    );

    const data = useMemo<TransformedOverviewOfEntities | undefined>(
        () => rawFeed && transformOverviewFeed(rawFeed),
        [rawFeed],
    );

    if (isLoading || error || !data || runFeedLoading || runFeedError || !run) {
        return <Skeleton animate w={'100%'} h={250} />;
    }

    return (
        <DataTable
            height={285}
            columns={[
                { accessor: 'Title', title: 'Title (Recent Test Suites)' },
                {
                    accessor: 'Started',
                    render: (record) => {
                        return (
                            <RelativeDate
                                date={record.Started}
                                relativeFrom={dayjs(run.started)}
                                showTime
                            />
                        );
                    },
                    width: 100,
                },
                {
                    accessor: 'Duration',
                    render: (record) => {
                        return <HumanizedDuration duration={record.Duration} />;
                    },
                },
                {
                    accessor: 'Rate',
                    render: (record) => {
                        return (
                            <PassedRate
                                rate={record.Rate}
                                text="Entities"
                                width={100}
                            />
                        );
                    },
                },
            ]}
            records={data?.recentSuites}
            striped
            highlightOnHover
            withColumnBorders
            shadow="md"
            withTableBorder
        />
    );
}

export default function PreviewTestRun(properties: {
    testID?: string;
}): ReactNode {
    return (
        <Card withBorder radius={'md'} p={'xs'}>
            <PreviewTestSuites testID={properties.testID} />
        </Card>
    );
}
