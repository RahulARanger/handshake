import {
    getOverAllAggResultsURL,
    getRelatedRuns,
    getSessionSummaryURL,
    getTestRun,
    getTestRunConfig,
    getTestRunSummary,
} from 'src/components/scripts/helper';
import type { DetailedTestRunPageProperties } from 'src/types/generated-response';
import getConnection from 'src/components/scripts/connection';
import LayoutStructureForRunDetails from 'src/components/core/TestRun';

import React from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swr-fallback';
import { menuTabs } from 'src/types/ui-constants';
import {
    getSessionSummary,
    getDetailsOfTestRun,
    generateTestRunSummary,
    getTestRunConfigRecords,
    getSomeAggResults,
} from 'src/components/scripts/RunPage/overview';
import Overview from 'src/components/core/TestRun/overview-tab';
import { attachmentPrefix } from 'src/components/core/TestRun/context';

import { getDetailsOfRelatedRuns } from 'src/components/scripts/runs';

export async function getStaticProps(prepareProperties: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedTestRunPageProperties>> {
    const testID = prepareProperties.params.id;

    const connection = await getConnection();

    const details = await getDetailsOfTestRun(connection, testID);
    const sessions = await getSessionSummary(connection, testID);

    if (sessions == undefined || details == undefined) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const testRunConfig = await getTestRunConfigRecords(connection, testID);
    const aggResults = await getSomeAggResults(connection, testID);
    const relatedRuns = await getDetailsOfRelatedRuns(
        connection,
        details.projectName,
    );

    await connection.close();
    const port = process.env.NEXT_PUBLIC_PY_PORT ?? '1212';

    return {
        props: {
            fallback: {
                [getTestRun(port, testID)]: details,
                [getTestRunSummary(port, testID)]:
                    generateTestRunSummary(details), // not a sql query
                [getSessionSummaryURL(port, testID)]: sessions,
                [getTestRunConfig(port, testID)]: testRunConfig,
                [getOverAllAggResultsURL(port, testID)]: aggResults,
                [getRelatedRuns(port, testID)]: relatedRuns,
            },
            testID,
            port,
            attachmentPrefix: process.env.ATTACHMENTS ?? attachmentPrefix,
        },
    };
}

export default function TestRunResults(
    properties: DetailedTestRunPageProperties,
): ReactNode {
    return (
        <EnsureFallback fallbackPayload={properties}>
            <LayoutStructureForRunDetails activeTab={menuTabs.overviewTab}>
                <Overview />
            </LayoutStructureForRunDetails>
        </EnsureFallback>
    );
}

export { default as getStaticPaths } from 'src/components/scripts/RunPage/generate-path';
