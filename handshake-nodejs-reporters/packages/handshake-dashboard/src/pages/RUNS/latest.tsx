import getConnection from 'src/components/scripts/connection';
import type TestRunRecord from 'src/types/test-run-records';
import { type GetStaticPropsResult } from 'next';
import React, { type ReactNode } from 'react';
import { latestRun } from 'src/components/scripts/config';
import { runPage } from 'src/components/links';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRunRecord[] }>
> {
    if (process.env.isDynamic) {
        return { props: { runs: undefined } };
    }

    const connection = await getConnection();
    const testID = await latestRun(connection);
    await connection.close();

    return {
        redirect: { destination: runPage(testID), permanent: true },
    };
}

export default function AllTestRunsDisplayedHere(): ReactNode {
    return <>Redirecting...</>;
}
