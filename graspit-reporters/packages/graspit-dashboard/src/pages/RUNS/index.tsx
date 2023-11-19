import getConnection from 'src/components/scripts/connection';
import type TestRunRecord from 'src/types/testRunRecords';
import GridOfRuns from 'src/components/core/ListOfRuns';

import { type GetStaticPropsResult } from 'next';
import React, { type ReactNode } from 'react';
import currentExportConfig from 'src/components/scripts/config';
import { getAllTestRunDetails } from 'src/components/scripts/runs';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRunRecord[] }>
> {
    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    if (exportConfig?.isDynamic === true) {
        return { props: { runs: undefined } };
    }

    const allRuns = await getAllTestRunDetails(
        connection,
        exportConfig?.maxTestRuns,
    );
    await connection.close();

    return {
        props: { runs: allRuns ?? [] },
    };
}

export default function AllTestRunsDisplayedHere(props: {
    runs?: TestRunRecord[];
}): ReactNode {
    if (props.runs == null) return <></>;
    return <GridOfRuns runs={props.runs} />;
}
