import {
    getOverAllAggResultsURL,
    getSessionSummaryURL,
    getTestRun,
    getTestRunConfig,
} from 'src/components/scripts/helper';
import type { SuiteDetails } from 'src/types/generated-response';
import { type DetailedTestRunPageProperties } from 'src/types/generated-response';
import getConnection from 'src/components/scripts/connection';
import LayoutStructureForRunDetails from 'src/components/core/TestRun';

import React from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swr-fallback';
import { menuTabs } from 'src/types/ui-constants';
import type {
    OverallAggResults,
    SessionSummary,
} from 'src/components/scripts/RunPage/overview';
import Overview from 'src/components/core/TestRun/overview-tab';
import { attachmentPrefix } from 'src/components/core/TestRun/context';

import sqlFile from 'src/components/scripts/RunPage/script';
import type TestRunRecord from 'src/types/test-run-records';
import type { TestRunConfig } from 'src/types/test-run-records';
import type { ImageRecord } from 'src/types/test-entity-related';

export async function getStaticProps(): Promise<
    GetStaticPropsResult<DetailedTestRunPageProperties>
> {
    const testID = '0e329d8f-9624-44e1-8d04-93e3771dd750';

    const connection = await getConnection();

    await connection.exec({
        sql: sqlFile('overview-script.sql').replace('?', testID),
    });
    const details = await connection.get<TestRunRecord>(
        'SELECT * FROM CURRENT_RUN',
    );
    const sessions = await connection.all<SessionSummary[]>(
        'SELECT * FROM SESSION_SUMMARY',
    );

    if (sessions == undefined || details == undefined) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const testRunConfig = await connection.get<TestRunConfig>(
        'SELECT * FROM TEST_CONFIG;',
    );

    const aggResults: OverallAggResults = {
        parentSuites: 0,
        files: 0,
        sessionCount: 0,
        imageCount: 0,
        recentSuites: await connection.all<SuiteDetails[]>(
            "SELECT * FROM RECENT_ENTITIES WHERE suiteType = 'SUITE';",
        ),
        recentTests: await connection.all<SuiteDetails[]>(
            "SELECT * FROM RECENT_ENTITIES WHERE suiteType = 'TEST';",
        ),
        randomImages: await connection.all<ImageRecord[]>(
            'SELECT * FROM IMAGES;',
        ),
    };
    await connection.each<{ key: string; value: number }>(
        'SELECT * FROM KEY_NUMBERS',
        (_, row) => {
            aggResults[
                row.key as
                    | 'parentSuites'
                    | 'files'
                    | 'sessionCount'
                    | 'imageCount'
            ] = row.value;
        },
    );

    await connection.close();
    const port = process.env.NEXT_PUBLIC_PY_PORT ?? '1212';

    return {
        props: {
            fallback: {
                [getTestRun(port, testID)]: details,
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
