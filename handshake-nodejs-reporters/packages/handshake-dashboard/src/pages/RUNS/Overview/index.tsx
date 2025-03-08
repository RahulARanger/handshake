import React, { useMemo, type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import { OverviewBoard } from 'components/about-test-run/overview-of-test-card';
import { jsonFeedAboutTestRun } from 'components/links';
import transformTestRunRecord from 'extractors/transform-run-record';
import type { Projects, TestRunRecord } from 'types/test-run-records';
import useSWRImmutable from 'swr/immutable';

export default function OverviewPage(properties: {
    mockRun?: TestRunRecord;
    mockProjects?: Projects;
}): ReactNode {
    const router = useRouter();
    const { testID } = router.query as { testID?: string };
    const {
        data: _rawRun,
        // isLoading,
        // error,
    } = useSWRImmutable<TestRunRecord>(
        testID && !properties.mockRun
            ? jsonFeedAboutTestRun(testID)
            : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const rawRun = _rawRun ?? properties.mockRun;

    const run = useMemo(
        () => rawRun && transformTestRunRecord(rawRun),
        [rawRun],
    );

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
