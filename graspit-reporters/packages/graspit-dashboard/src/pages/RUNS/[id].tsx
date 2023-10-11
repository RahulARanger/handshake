import {
    getEntityLevelAttachment,
    getSessions,
    getSuites,
    getTestRun,
    getTestRunConfig,
    getTestRunSummary,
    getTests,
} from 'src/Generators/helper';
import type { DetailedTestRunPageProps } from 'src/types/generatedResponse';
import {
    generateTestRunSummary,
    getAllTestRuns,
    getDetailsOfTestRun,
    getTestRunConfigRecords,
} from 'src/Generators/Queries/testRunRelated';
import getAllSuites, {
    getAllEntityLevelAttachments,
    getAllTests,
} from 'src/Generators/Queries/testEntityRelated';
import getAllSessions from 'src/Generators/Queries/sessionRelated';
import getConnection from 'src/Generators/dbConnection';
import MetaCallContext from 'src/components/core/TestRun/context';
import currentExportConfig from 'src/Generators/Queries/exportConfig';
import DetailedTestRun from 'src/components/core/TestRun';

import React from 'react';
import { type GetStaticPathsResult, type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { getLogger } from 'log4js';

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
    const logger = getLogger('TestRunRelated');
    logger.level = 'debug';
    logger.info('📃 Fetching list of test runs...');
    const connection = await getConnection();

    const exportConfig = await currentExportConfig(connection);
    const paths = await getAllTestRuns(connection, exportConfig?.maxTestRuns);
    await connection.close();

    logger.info('✅ Test Runs generated');

    return {
        paths: paths.map((path) => ({ params: { id: path } })),
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
    if (details == null) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }
    const suites = await getAllSuites(connection, testID);
    const tests = await getAllTests(connection, testID);
    const sessions = await getAllSessions(connection, testID);
    const testRunConfig = await getTestRunConfigRecords(connection, testID);
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
                [getSuites(port, testID)]: suites,
                [getTestRunSummary(port, testID)]:
                    generateTestRunSummary(details), // not a sql query
                [getTests(port, testID)]: tests,
                [getSessions(port, testID)]: sessions,
                [getTestRunConfig(port, testID)]: testRunConfig,
                [getEntityLevelAttachment(port, testID)]:
                    entityLevelAttachments,
            },
            test_id: testID,
            port,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps,
): ReactNode {
    const fallback = props.fallback;
    return (
        <SWRConfig value={{ fallback }}>
            <MetaCallContext.Provider
                value={{ port: props.port, testID: props.test_id }}
            >
                <DetailedTestRun />
            </MetaCallContext.Provider>
        </SWRConfig>
    );
}
