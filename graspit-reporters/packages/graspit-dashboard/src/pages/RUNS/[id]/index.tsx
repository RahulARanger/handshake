import {
    getOverAllAggResultsURL,
    getRecentSuitesURL,
    getSessionSummaryURL,
    getTestRun,
    getTestRunConfig,
    getTestRunSummary,
} from 'src/components/scripts/helper';
import type { DetailedTestRunPageProps } from 'src/types/generatedResponse';
import getConnection from 'src/components/scripts/connection';
import DetailedTestRun from 'src/components/core/TestRun';

import React from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swrFallback';
import { overviewTab } from 'src/types/uiConstants';
import {
    getSessionSummary,
    getDetailsOfTestRun,
    generateTestRunSummary,
    getRecentSuites,
    getTestRunConfigRecords,
    getSomeAggResults,
} from 'src/components/scripts/RunPage/overview';
import Overview from 'src/components/core/TestRun/Overview';
import { attachmentPrefix } from 'src/components/core/TestRun/context';
import staticPaths from 'src/components/scripts/RunPage/generatePaths';

export const getStaticPaths = staticPaths;
export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedTestRunPageProps>> {
    const testID = prepareProps.params.id;

    const connection = await getConnection();

    const details = await getDetailsOfTestRun(connection, testID);
    const sessions = await getSessionSummary(connection, testID);
    const recentSuites = await getRecentSuites(connection, testID);

    if (sessions == null || details == null) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const testRunConfig = await getTestRunConfigRecords(connection, testID);
    const aggResults = await getSomeAggResults(connection, testID);

    await connection.close();
    const port = process.env.NEXT_PUBLIC_PY_PORT ?? '1212';

    return {
        props: {
            fallback: {
                [getTestRun(port, testID)]: details,
                [getTestRunSummary(port, testID)]:
                    generateTestRunSummary(details), // not a sql query
                [getRecentSuitesURL(port, testID)]: recentSuites,
                [getSessionSummaryURL(port, testID)]: sessions,
                [getTestRunConfig(port, testID)]: testRunConfig,
                [getOverAllAggResultsURL(port, testID)]: aggResults,
            },
            testID,
            port,
            attachmentPrefix: process.env.ATTACHMENTS ?? attachmentPrefix,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps,
): ReactNode {
    return (
        <EnsureFallback fallbackPayload={props}>
            <DetailedTestRun activeTab={overviewTab}>
                <Overview />
            </DetailedTestRun>
        </EnsureFallback>
    );
}
