import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@handshake/utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import ListOfSuits from 'components/about-test-entities/list-of-suites';

export default function OverviewPage(): ReactNode {
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
            <RunPageContent testID={testID} where={'Suites'}>
                <ListOfSuits testID={testID} />
            </RunPageContent>
        </>
    );
}
