import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import { RunsPageContent } from 'components/about-test-runs/test-runs-page-layout';

export default function AllTestRunsDisplayedHere(): ReactNode {
    return (
        <>
            <Head>
                <title>{TEXT.RUNS.greet}</title>
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.RUNS.description} />
            </Head>
            <RunsPageContent />
        </>
    );
}
