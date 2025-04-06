import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import { OverviewBoard } from 'components/about-test-run/overview-page';
import type { Projects, TestRunRecord } from 'types/test-run-records';
import { useProcessedTestRun } from 'hooks/get-test-run';

export default function OverviewPage(properties: {
    mockRun?: TestRunRecord;
    mockProjects?: Projects;
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
                <meta name="keywords" content="Overview" />
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.OVERVIEW.description} />
            </Head>
            <RunPageContent
                // NOTE: do not send object: run, else it will not refresh when pushing a new route
                where={'Overview'}
                run={run}
            >
                <OverviewBoard run={run} mockData={properties.mockProjects} />
            </RunPageContent>
        </>
    );
}
