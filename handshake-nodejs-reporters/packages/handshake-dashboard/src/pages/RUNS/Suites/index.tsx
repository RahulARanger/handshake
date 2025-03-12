import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import ListOfSuits from 'components/about-test-entities/list-of-suites';
import { SuiteRecordDetails } from 'types/test-entity-related';
import { TestRunRecord } from 'types/test-run-records';
import { useProcessedTestRun } from 'hooks/get-test-run';

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
