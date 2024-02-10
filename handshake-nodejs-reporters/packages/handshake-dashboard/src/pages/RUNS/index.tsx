import getConnection from 'src/components/scripts/connection';
import GridOfRuns from 'src/components/core/ListOfRuns';
import { type GetStaticPropsResult } from 'next';
import React, { type ReactNode } from 'react';
import currentExportConfig from 'src/components/scripts/config';
import sqlFile from 'src/components/scripts/RunPage/script';
import Head from 'next/head';
import { TEXT } from 'handshake-utils';
import { parseTestConfig } from 'src/components/parse-utils';
import type { TestRecord } from 'src/types/test-run-records';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRecord[] }>
> {
    if (process.env.isDynamic) {
        return { props: { runs: undefined } };
    }

    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    const allRuns = await connection.all<TestRecord[]>(
        sqlFile('runs-page.sql'),
        Number(exportConfig?.maxTestRuns ?? -1),
    );

    await connection.close();

    return {
        props: { runs: allRuns.map((record) => parseTestConfig(record)) ?? [] },
    };
}

export default function AllTestRunsDisplayedHere(properties: {
    runs: TestRecord[];
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
            <GridOfRuns runs={properties.runs} />
        </>
    );
}
