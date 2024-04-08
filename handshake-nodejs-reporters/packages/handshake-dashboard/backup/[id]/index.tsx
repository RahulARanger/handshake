import getConnection from 'scripts/connection';
import LayoutStructureForRunDetails from 'components/core/TestRun';
import React, { useMemo } from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import { menuTabs } from 'types/ui-constants';
import Overview from 'components/core/TestRun/overview-tab';
import sqlFile from 'scripts/run-page/script';
import type OnlyTestRunRecord from 'types/test-run-records';
import type { TestRunConfig } from 'types/test-run-records';
import type {
    ImageRecord,
    SuiteRecordDetails,
} from 'types/test-entity-related';
import { parseEntitiesForOverview } from 'components/utils/parse-overview-records';
import type {
    OverallAggResults,
    OverviewPageProperties,
    SessionSummary,
} from 'types/records-in-overview';
import {
    OverviewContext,
    type ValuesInOverviewContext,
} from 'types/parsed-overview-records';
import {
    parseDetailedTestRun,
    parseImageRecords,
    parseTestConfig,
} from 'components/parse-utils';
import Head from 'next/head';
import { TEXT } from 'handshake-utils';

export async function getStaticProps(prepareProperties: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<OverviewPageProperties>> {
    const testID = prepareProperties.params.id;
    const connection = await getConnection();

    await connection.exec({
        sql: sqlFile('overview-page.sql').replace('?', testID),
    });
    const detailsOfTestRun = await connection.get<OnlyTestRunRecord>(
        'SELECT * FROM CURRENT_RUN',
    );
    const summaryForAllSessions = await connection.all<SessionSummary[]>(
        'SELECT * FROM SESSION_SUMMARY',
    );

    if (summaryForAllSessions == undefined || detailsOfTestRun == undefined) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const testRunConfig = (await connection.get<TestRunConfig>(
        'SELECT * FROM TEST_CONFIG;',
    )) ?? {
        platform: 'not-known',
        avoidParentSuitesInCount: false,
        bail: -1,
        exitCode: -2,
        fileRetries: -1,
        maxInstances: -1,
        frameworks: [],
        framework: 'unknown',
        test_id: testID,
    };

    const recentSuites =
        (await connection.all<SuiteRecordDetails[]>(
            'SELECT * FROM RECENT_SUITES',
        )) ?? [];

    const recentTests =
        (await connection.all<SuiteRecordDetails[]>(
            'SELECT * FROM RECENT_TESTS',
        )) ?? [];

    const randomImages = await connection.all<ImageRecord[]>(
        'SELECT * FROM IMAGES;',
    );

    const relatedRuns = await connection.all<OnlyTestRunRecord[]>(
        'select * from RELATED_RUNS',
    );

    const aggResults: OverallAggResults = {
        parentSuites: 0,
        files: 0,
        sessionCount: 0,
        imageCount: 0,
        brokenTests: 0,
        isRecent: false,
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

    return {
        props: {
            detailsOfTestRun,
            summaryForAllSessions,
            testRunConfig,
            aggResults,
            recentTests,
            recentSuites,
            relatedRuns,
            randomImages: parseImageRecords(randomImages, testID),
        },
    };
}

export default function TestRunResults(
    properties: OverviewPageProperties,
): ReactNode {
    const parsedRecords: ValuesInOverviewContext = useMemo(() => {
        return {
            recentTests: parseEntitiesForOverview(properties.recentTests),
            recentSuites: parseEntitiesForOverview(properties.recentSuites),
            randomImages: properties.randomImages,
            aggResults: properties.aggResults,
            detailsOfTestRun: parseDetailedTestRun(properties.detailsOfTestRun),
            summaryForAllSessions: properties.summaryForAllSessions,
            testRunConfig: parseTestConfig(properties.testRunConfig),
            relatedRuns: properties.relatedRuns.map((run) =>
                parseDetailedTestRun(run),
            ),
        };
    }, [properties]);

    return (
        <>
            <Head>
                <title>{TEXT.OVERVIEW.greet}</title>
                <meta name="keywords" content="Test Results, List of Runs" />
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.OVERVIEW.description} />
                <meta
                    name="project"
                    content={properties.detailsOfTestRun.projectName}
                />
                <meta
                    name="passed-tests"
                    content={properties.detailsOfTestRun.passed.toString()}
                />
                <meta
                    name="failed-tests"
                    content={properties.detailsOfTestRun.failed.toString()}
                />
                <meta
                    name="skipped-tests"
                    content={properties.detailsOfTestRun.skipped.toString()}
                />
                <meta
                    name="passed-suites"
                    content={parsedRecords.detailsOfTestRun.SuitesSummary[0].toString()}
                />
                <meta
                    name="failed-suites"
                    content={parsedRecords.detailsOfTestRun.SuitesSummary[1].toString()}
                />
                <meta
                    name="skipped-suites"
                    content={parsedRecords.detailsOfTestRun.SuitesSummary[2].toString()}
                />
            </Head>
            <OverviewContext.Provider value={parsedRecords}>
                <LayoutStructureForRunDetails activeTab={menuTabs.overviewTab}>
                    <Overview />
                </LayoutStructureForRunDetails>
            </OverviewContext.Provider>
        </>
    );
}

export { default as getStaticPaths } from 'scripts/run-page/generate-path';
