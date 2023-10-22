import {
    getEntityLevelAttachment,
    getSessionSummaryURL,
    getTestRun,
    getTestRunSummary,
    getTests,
} from 'src/components/scripts/helper';
import type { DetailedTestRunPageProps } from 'src/types/generatedResponse';
import {
    getAllEntityLevelAttachments,
    getAllTests,
} from 'src/Generators/Queries/testEntityRelated';
import getConnection from 'src/components/scripts/connection';
import DetailedTestRun from 'src/components/core/TestRun';

import React from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swrFallback';
import { testEntitiesTab } from 'src/types/uiConstants';
import {
    getSessionSummary,
    getDetailsOfTestRun,
    generateTestRunSummary,
} from 'src/components/scripts/RunPage/overview';
import { attachmentPrefix } from 'src/components/core/TestRun/context';
import { getStaticPaths as staticPaths } from 'src/pages/RUN/[id]';

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
            attachmentPrefix: process.env.ATTACHMENTS ?? attachmentPrefix,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps,
): ReactNode {
    return (
        <EnsureFallback fallbackPayload={props}>
            <DetailedTestRun activeTab={testEntitiesTab} show>
                <></>
            </DetailedTestRun>
        </EnsureFallback>
    );
}
