import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import TEXTS from 'components/meta-text';
import OverviewCard from 'components/about-test-entities/overview-of-test-entity-card';

export default function OverviewPage(): ReactNode {
    const router = useRouter();
    const { testID, suiteID } = router.query as {
        testID?: string;
        suiteID?: string;
    };

    return (
        <>
            <Head>
                <title>{TEXTS.SUITE.title}</title>
                <meta name="keywords" content="Grid,TestReports" />
                <meta name="author" content={TEXTS.AUTHOR} />
                <meta name="description" content={TEXTS.SUITE.description} />
            </Head>
            <RunPageContent
                testID={testID}
                where={'Suites'}
                isSuiteDetailedView
            >
                <OverviewCard suiteID={suiteID} testID={testID} />
            </RunPageContent>
        </>
    );
}
