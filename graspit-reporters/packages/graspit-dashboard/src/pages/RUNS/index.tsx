import getConnection from 'src/Generators/dbConnection';
import { getAllTestRunDetails } from 'src/Generators/Queries/testRunRelated';
import currentExportConfig from 'src/Generators/Queries/exportConfig';
import type TestRunRecord from 'src/types/testRunRecords';
import GridOfRuns from 'src/components/core/ListOfRuns';

import { type GetStaticPropsResult } from 'next';
import React, { type ReactNode } from 'react';
import { getLogger } from 'log4js';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<{ runs?: TestRunRecord[] }>
> {
    const logger = getLogger('Run-Page');
    logger.level = 'debug';

    const connection = await getConnection();
    const exportConfig = await currentExportConfig(connection);

    if (exportConfig?.isDynamic === true) {
        logger.info('Skipping /RUNS route for the dynamic export');
        return { props: { runs: undefined } };
    }

    const allRuns = await getAllTestRunDetails(
        connection,
        exportConfig?.maxTestRuns,
    );
    if ((allRuns?.length ?? 0) > 0)
        logger.info(`Found ${allRuns?.length} Test Runs, Generating page.`);

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
