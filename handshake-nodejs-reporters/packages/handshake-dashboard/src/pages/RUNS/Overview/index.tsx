import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from 'handshake-utils';
import { useRouter } from 'next/router';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import { SimpleGrid, Stack } from '@mantine/core';
import OverviewCard from 'components/about-test-run/overview-of-test-card';
import MoreAboutTestRun from 'components/about-test-run/preview-project-structure';
import PreviewTestRun from 'components/about-test-run/preview-run';

export default function AllTestRunsDisplayedHere(): ReactNode {
    const router = useRouter();
    const { testID } = router.query as { testID?: string };

    return (
        <>
            <Head>
                <title>{TEXT.OVERVIEW.greet}</title>
                <meta name="keywords" content="Test Results, List of Runs" />
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.OVERVIEW.description} />
            </Head>
            <RunPageContent testID={testID} where={'Overview'}>
                <SimpleGrid cols={2}>
                    <OverviewCard testID={testID} />
                    <SimpleGrid cols={1}>
                        <MoreAboutTestRun testID={testID} />
                        <PreviewTestRun testID={testID} />
                    </SimpleGrid>
                </SimpleGrid>
            </RunPageContent>
        </>
    );
}
