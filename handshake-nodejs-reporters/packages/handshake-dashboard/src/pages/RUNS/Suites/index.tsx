import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import ListOfSuits from 'components/about-test-entities/list-of-suites';
import { SuiteRecordDetails } from 'types/test-entity-related';
import { TestRunRecord } from 'types/test-run-records';

export default function EntitiesView(properties: {
    mockSuites?: SuiteRecordDetails[];
    mockRun?: TestRunRecord;
}): ReactNode {
    const router = useRouter();
    const { testID } = router.query as { testID?: string };
    return (
        <>
            <Head>
                <title>{TEXT.OVERVIEW.greet}</title>
                <meta name="keywords" content="Grid,TestReports" />
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.OVERVIEW.description} />
            </Head>
            <RunPageContent
                testID={testID}
                where={'Suites'}
                mockData={properties.mockRun}
            >
                <ListOfSuits
                    testID={testID}
                    mockRun={properties.mockRun}
                    mockSuites={properties.mockSuites}
                />
            </RunPageContent>
        </>
    );
}
