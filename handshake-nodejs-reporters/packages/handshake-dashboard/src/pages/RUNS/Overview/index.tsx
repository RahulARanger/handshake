import React, { useMemo, type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@handshake/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import { Grid } from '@mantine/core';
import OverviewCard from 'components/about-test-run/overview-of-test-card';
import PreviewTestRun from 'components/about-test-run/preview-run';
import { jsonFeedAboutTestRun } from 'components/links';
import transformTestRunRecord from 'extractors/transform-run-record';
import type { TestRunRecord } from 'types/test-run-records';
import useSWRImmutable from 'swr/immutable';

export default function OverviewPage(): ReactNode {
    const router = useRouter();
    const { testID } = router.query as { testID?: string };
    const {
        data: rawRun,
        // isLoading,
        // error,
    } = useSWRImmutable<TestRunRecord>(
        testID ? jsonFeedAboutTestRun(testID) : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(testID as string)).then(
                async (response) => response.json(),
            ),
    );

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
                testID={testID}
                // NOTE: do not send object: run else it will not refresh when pushing a new route
                where={'Overview'}
                avoidScrollWindow
            >
                <Grid columns={2}>
                    <Grid.Col span={1}>
                        <OverviewCard run={run} />
                    </Grid.Col>
                    <Grid.Col span={1}>
                        <PreviewTestRun run={run} />
                    </Grid.Col>
                </Grid>
            </RunPageContent>
        </>
    );
}
