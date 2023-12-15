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
import DetailedTestRun from 'src/components/core/TestRun';

import React, { useState } from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swr-fallback';
import { testEntitiesTab, timelineTab } from 'src/types/ui-constants';
import {
    getDetailsOfTestRun,
    generateTestRunSummary,
} from 'src/components/scripts/RunPage/overview';
import { attachmentPrefix } from 'src/components/core/TestRun/context';

import TestEntities from 'src/components/core/test-entities';
import { getDrillDownResults } from 'src/components/scripts/RunPage/detailed';
import GanttChartForTestEntities from 'src/components/charts/gantt-chart-for-test-suites';
import SpinFC from 'antd/lib/spin';

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

function ReturnChild(properties: { tab: string }) {
    switch (properties.tab) {
        case testEntitiesTab: {
            return <TestEntities />;
        }
        case timelineTab: {
            return <GanttChartForTestEntities />;
        }
        default: {
            return <SpinFC tip="Loading..." size="large" fullscreen />;
        }
    }
}

export default function TestRunResults(
    properties: DetailedTestRunPageProperties,
): ReactNode {
    const [current, setCurrent] = useState(testEntitiesTab);
    return (
        <EnsureFallback fallbackPayload={properties}>
            <DetailedTestRun
                activeTab={current}
                show
                onChange={(now) => setCurrent(now)}
            >
                <ReturnChild tab={current} />
            </DetailedTestRun>
        </EnsureFallback>
    );
}

export { default as getStaticPaths } from 'src/components/scripts/RunPage/generate-path';
