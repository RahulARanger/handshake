import {
    getEntityLevelAttachment,
    getRetriedRecords,
    getSessions,
    getSuites,
    getTestRun,
    getTestRunSummary,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import type { DetailedTestRunPageProperties } from 'src/types/generated-response';
import getConnection from 'src/components/scripts/connection';
import LayoutStructureForRunDetails from 'src/components/core/TestRun';

import React, { useState } from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swr-fallback';
import {
    getDetailsOfTestRun,
    generateTestRunSummary,
} from 'src/components/scripts/RunPage/overview';
import { attachmentPrefix } from 'src/components/core/TestRun/context';

import TestEntities from 'src/components/core/test-entities';
import { getDrillDownResults } from 'src/components/scripts/RunPage/detailed';
import { menuTabs } from 'src/types/ui-constants';
import { useSearchParams } from 'next/navigation';

export async function getStaticProps(prepareProperties: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedTestRunPageProperties>> {
    const testID = prepareProperties.params.id;

    const connection = await getConnection();

    const details = await getDetailsOfTestRun(connection, testID);

    if (details == undefined) {
        return {
            redirect: {
                permanent: true,
                destination: '/RUNS/no-test-run-found',
            },
        };
    }

    const {
        tests,
        suites,
        sessions,
        attachments,
        writtenAttachments,
        retriedRecords,
    } = await getDrillDownResults(connection, testID);

    await connection.close();
    const port = process.env.NEXT_PUBLIC_PY_PORT ?? '1212';

    return {
        props: {
            fallback: {
                [getTestRun(port, testID)]: details,
                [getSessions(port, testID)]: sessions,
                [getTestRunSummary(port, testID)]:
                    generateTestRunSummary(details), // not a sql query
                [getSuites(port, testID)]: suites,
                [getTests(port, testID)]: tests,
                [getEntityLevelAttachment(port, testID)]: attachments,
                [getWrittenAttachments(port, testID)]: writtenAttachments,
                [getRetriedRecords(port, testID)]: retriedRecords,
            },
            testID: testID,
            port,
            attachmentPrefix: process.env.ATTACHMENTS ?? attachmentPrefix,
        },
    };
}

export default function TestRunResults(
    properties: DetailedTestRunPageProperties,
): ReactNode {
    const pathName = useSearchParams();
    const [defaultTab, setDefaultTab] = useState<string>(
        pathName?.get('tab') === menuTabs.testEntitiesTab.treeViewMode
            ? menuTabs.testEntitiesTab.treeViewMode
            : menuTabs.testEntitiesTab.gridViewMode,
    );
    return (
        <EnsureFallback fallbackPayload={properties}>
            <LayoutStructureForRunDetails
                activeTab={defaultTab}
                changeDefault={setDefaultTab}
            >
                <TestEntities defaultTab={defaultTab} />
            </LayoutStructureForRunDetails>
        </EnsureFallback>
    );
}

export { default as getStaticPaths } from 'src/components/scripts/RunPage/generate-path';
