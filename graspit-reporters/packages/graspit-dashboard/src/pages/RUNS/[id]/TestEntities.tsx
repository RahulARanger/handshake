import {
    getEntityLevelAttachment,
    getSessionSummaryURL,
    getTestRun,
    getTestRunSummary,
    getTests,
} from 'src/Generators/helper';
import type { DetailedTestRunPageProps } from 'src/types/generatedResponse';
import {
    getAllEntityLevelAttachments,
    getAllTests,
} from 'src/Generators/Queries/testEntityRelated';
import getConnection from 'src/components/scripts/connection';
import currentExportConfig from 'src/Generators/Queries/exportConfig';
import DetailedTestRun from 'src/components/core/TestRun';

import React from 'react';
import { type GetStaticPathsResult, type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swrFallback';
import { overviewTab, testEntitiesTab } from 'src/types/uiConstants';
import {
    getSessionSummary,
    getDetailsOfTestRun,
    generateTestRunSummary,
} from 'src/components/scripts/RunPage/overview';
import { getAllTestRuns } from 'src/components/scripts/runs';

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
    const connection = await getConnection();

    const exportConfig = await currentExportConfig(connection);
    const paths = await getAllTestRuns(connection, exportConfig?.maxTestRuns);
    await connection.close();

    return {
        paths: [
            ...paths.map((path) => ({
                params: { id: path, tab: overviewTab },
            })),
        ],
        fallback: false,
    };
}

export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedTestRunPageProps>> {
    const testID = prepareProps.params.id;

    const connection = await getConnection();

    const details = await getDetailsOfTestRun(connection, testID);
    const sessions = await getSessionSummary(connection, testID);

    if (sessions == null || details == null) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const tests = await getAllTests(connection, testID);
    const entityLevelAttachments = await getAllEntityLevelAttachments(
        connection,
        testID,
    );

    await connection.close();
    const port = process.env.NEXT_PUBLIC_PY_PORT ?? '1212';

    return {
        props: {
            fallback: {
                [getTestRun(port, testID)]: details,
                [getTestRunSummary(port, testID)]:
                    generateTestRunSummary(details), // not a sql query
                [getTests(port, testID)]: tests,
                [getSessionSummaryURL(port, testID)]: sessions,
                [getEntityLevelAttachment(port, testID)]:
                    entityLevelAttachments,
            },
            testID: testID,
            port,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps,
): ReactNode {
    return (
        <EnsureFallback fallbackPayload={props}>
            <DetailedTestRun activeTab={testEntitiesTab}>
                <></>
            </DetailedTestRun>
        </EnsureFallback>
    );
}
