import type { DetailedTestRunPageProperties } from 'src/types/generated-response';
import getConnection from 'src/components/scripts/connection';
import LayoutStructureForRunDetails from 'src/components/core/TestRun';

import React, { useMemo, useState } from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import sqlFile from 'src/components/scripts/RunPage/script';
import type TestRunRecord from 'src/types/test-run-records';
import type {
    TestRecordDetails,
    ImageRecord,
    AssertionRecord,
} from 'src/types/test-entity-related';
import { type SuiteRecordDetails } from 'src/types/test-entity-related';
import type DetailedPageProperties from 'src/types/records-in-detailed';
import type { ValuesInDetailedContext } from 'src/types/records-in-detailed';
import { DetailedContext } from 'src/types/records-in-detailed';
import {
    parseDetailedTestRun,
    parseImageRecords,
} from 'src/components/parse-utils';
import { attachmentPrefix } from 'src/types/ui-constants';

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

    const detailsOfTestRun = await connection.get<TestRunRecord>(
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

    await connection.close();

    return {
        props: {
            detailsOfTestRun,
            suites,
            tests,
            assertions,
            images,
        },
    };
}

export default function TestRunResults(
    properties: DetailedPageProperties,
): ReactNode {
    const parsedRecords: ValuesInDetailedContext = useMemo(() => {
        return {
            detailsOfTestRun: parseDetailedTestRun(properties.detailsOfTestRun),
            images: parseImageRecords(
                properties.images,
                attachmentPrefix,
                properties.detailsOfTestRun.testID,
            ),
        };
    }, [properties]);

    // <LayoutStructureForRunDetails
    //             activeTab={defaultTab}
    //             changeDefault={setDefaultTab}
    //         >
    //             <TestEntities defaultTab={defaultTab} />
    //         </LayoutStructureForRunDetails>
    return (
        <DetailedContext.Provider
            value={parsedRecords}
        ></DetailedContext.Provider>
    );
}

export { default as getStaticPaths } from 'src/components/scripts/RunPage/generate-path';
