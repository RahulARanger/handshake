import GridOfRuns from '@/core/ListOfRuns';
import React, { type ReactNode } from 'react';
import Head from 'next/head';
import { TEXT } from 'handshake-utils';
import type { TestRecord } from '@/types/test-run-records';

export default function AllTestRunsDisplayedHere(properties: {
    runs: TestRecord[];
    about?: string;
}): ReactNode {
    return (
        <>
            <Head>
                <title>{TEXT.RUNS.greet}</title>
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.RUNS.description} />
                <meta
                    name="test-runs"
                    content={properties.runs.length.toString()}
                />
            </Head>
            <GridOfRuns runs={properties.runs} about={properties.about ?? ''} />
        </>
    );
}
