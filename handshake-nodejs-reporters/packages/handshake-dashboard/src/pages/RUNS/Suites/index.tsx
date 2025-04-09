'use client';

import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import { SuiteRecordDetails } from 'types/test-entity-related';
import { TestRunRecord } from 'types/test-run-records';
import { useProcessedTestRun } from 'hooks/get-test-run';

// for mantine data table styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import dynamic from 'next/dynamic';
import { Skeleton } from '@mantine/core';

const ListOfSuits = dynamic(
    () => import('components/about-test-entities/list-of-suites'),
    { ssr: false, loading: () => <Skeleton width={'99vw'} height={'55vh'} /> },
);

export default function EntitiesView(properties: {
    mockSuites?: SuiteRecordDetails[];
    mockRun?: TestRunRecord;
}): ReactNode {
    const router = useRouter();
    const { testID } = router.query as { testID?: string };
    const { run } = useProcessedTestRun({
        mockRun: properties.mockRun,
        testID,
    });

    return (
        <>
            <Head>
                <title>{TEXT.OVERVIEW.greet}</title>
                <meta name="keywords" content="Grid,TestReports" />
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.OVERVIEW.description} />
            </Head>
            <RunPageContent where={'Suites'} run={run}>
                <ListOfSuits
                    testID={testID}
                    run={run}
                    mockSuites={properties.mockSuites}
                />
            </RunPageContent>
        </>
    );
}
