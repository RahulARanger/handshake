import getConnection from 'src/components/scripts/connection';
import type TestRunRecord from 'src/types/test-run-records';
import GridOfRuns from 'src/components/core/ListOfRuns';
import { type GetStaticPropsResult } from 'next';
import React, { type ReactNode } from 'react';
import currentExportConfig from 'src/components/scripts/config';
import sqlFile from 'src/components/scripts/RunPage/script';
import Head from 'next/head';
import { TEXT } from 'handshake-utils';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRunRecord[] }>
> {
    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    if (process.env.isDynamic) {
        return { props: { runs: undefined } };
    }

    const allRuns = await connection.all<TestRunRecord[]>(
        sqlFile('runs-page.sql'),
        Number(exportConfig?.maxTestRuns ?? -1),
    );
    await connection.close();

    return {
        props: { runs: allRuns ?? [] },
    };
}

export default function AllTestRunsDisplayedHere(properties: {
    runs: TestRunRecord[];
}): ReactNode {
    return (
        <>
            <Head>
                <title>{TEXT.RUNS.greet}</title>
                <meta name="keywords" content="Test Results, List of Runs" />
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.RUNS.description} />
            </Head>
            <GridOfRuns runs={properties.runs} />
        </>
    );
}
