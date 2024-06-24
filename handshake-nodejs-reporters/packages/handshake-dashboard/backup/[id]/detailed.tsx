import getConnection from 'scripts/connection';
import LayoutStructureForRunDetails from 'components/core/TestRun';

import React, { useEffect, useMemo, useState } from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import sqlFile from 'scripts/run-page/script';
import type OnlyTestRunRecord from 'types/test-run-records';
import type {
    TestRecordDetails,
    ImageRecord,
    AssertionRecord,
    RetriedRecord,
} from 'types/test-entity-related';
import { type SuiteRecordDetails } from 'types/test-entity-related';
import type DetailedPageProperties from 'types/records-in-detailed';
import type { ValuesInDetailedContext } from 'types/records-in-detailed';
import { DetailedContext } from 'types/records-in-detailed';
import {
    parseDetailedTestRun,
    parseImageRecords,
    parseRetriedRecords,
    parseSuites,
    parseTests,
} from 'components/parse-utils';
import { menuTabs } from 'types/ui-constants';
import { useRouter } from 'next/router';
import TestEntities from 'components/core/test-entities';
import Head from 'next/head';
import { TEXT } from '@hand-shakes/utils';
import type DetailedPageParameters from 'types/redirection-parameters';

export async function getStaticProps(prepareProperties: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedPageProperties>> {
    const testID = prepareProperties.params.id;

    const connection = await getConnection();

    await connection.exec({
        sql: sqlFile('detailed-page.sql').replace('?', testID),
    });

    const detailsOfTestRun = await connection.get<OnlyTestRunRecord>(
        'SELECT * from CURRENT_RUN;',
    );

    if (detailsOfTestRun == undefined) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const suites =
        (await connection.all<SuiteRecordDetails[]>('SELECT * FROM SUITES;')) ??
        [];

    const tests =
        (await connection.all<TestRecordDetails[]>('SELECT * FROM TESTS;')) ??
        [];

    const assertions = await connection.all<AssertionRecord[]>(
        'SELECT * from ASSERTIONS;',
    );
    const images = await connection.all<ImageRecord[]>('SELECT * FROM IMAGES;');

    const retriedRecords =
        (await connection.all<RetriedRecord[]>('SELECT * FROM RETRIES;')) ?? [];

    await connection.close();

    return {
        props: {
            detailsOfTestRun,
            suites,
            tests,
            assertions,
            images: parseImageRecords(images, detailsOfTestRun.testID),
            retriedRecords,
        },
    };
}

export default function TestRunResults(
    properties: DetailedPageProperties,
): ReactNode {
    const parsedRecords: ValuesInDetailedContext = useMemo(() => {
        const testRun = parseDetailedTestRun(properties.detailsOfTestRun);
        const suites = parseSuites(
            properties.suites,
            testRun.Started[0],
            testRun.Tests,
        );
        return {
            detailsOfTestRun: testRun,
            suites,
            tests: parseTests(
                properties.tests,
                suites,
                properties.images,
                properties.assertions,
            ),
            retriedRecords: parseRetriedRecords(properties.retriedRecords),
        };
    }, [properties]);
    const router = useRouter();
    const [viewMode, setViewMode] = useState<string>(
        (router.query?.tab as string | undefined) ??
            menuTabs.testEntitiesTab.gridViewMode,
    );
    const [highlight, setHightLight] = useState<string>('');

    useEffect(() => {
        if (!router.isReady) return;
        const query = router.query as DetailedPageParameters;
        const requestedTab = query.tab?.trim()?.toLowerCase() ?? '';
        setViewMode(
            [
                menuTabs.testEntitiesTab.gridViewMode,
                menuTabs.testEntitiesTab.treeViewMode,
            ].includes(requestedTab)
                ? requestedTab
                : '',
        );
    }, [setViewMode, router]);

    return (
        <>
            <Head>
                <title>{`${TEXT.DETAILED.greet} - ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1).toLowerCase()}`}</title>
                <meta name="author" content={TEXT.AUTHOR} />
                <meta name="description" content={TEXT.DETAILED.description} />
                <meta
                    name="project"
                    content={properties.detailsOfTestRun.projectName}
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
            <DetailedContext.Provider value={parsedRecords}>
                <LayoutStructureForRunDetails
                    activeTab={viewMode}
                    changeDefault={setViewMode}
                    highlight={highlight}
                >
                    <TestEntities
                        defaultTab={viewMode}
                        setHightLight={setHightLight}
                    />
                </LayoutStructureForRunDetails>
            </DetailedContext.Provider>
        </>
    );
}

export { default as getStaticPaths } from 'scripts/run-page/generate-path';
