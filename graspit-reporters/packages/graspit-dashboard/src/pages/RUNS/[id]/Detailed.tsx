import {
    getEntityLevelAttachment,
    getSessions,
    getSuites,
    getTestRun,
    getTestRunSummary,
    getTests,
    getWrittenAttachments,
} from 'src/components/scripts/helper';
import type { DetailedTestRunPageProps } from 'src/types/generatedResponse';
import getConnection from 'src/components/scripts/connection';
import DetailedTestRun from 'src/components/core/TestRun';

import React, { useState } from 'react';
import { type GetStaticPropsResult } from 'next';
import { type ReactNode } from 'react';
import EnsureFallback from 'src/components/utils/swrFallback';
import { testEntitiesTab } from 'src/types/uiConstants';
import {
    getDetailsOfTestRun,
    generateTestRunSummary,
} from 'src/components/scripts/RunPage/overview';
import { attachmentPrefix } from 'src/components/core/TestRun/context';
import staticPaths from 'src/components/scripts/RunPage/generatePaths';
import TestEntities from 'src/components/core/testEntities';
import { getDrillDownResults } from 'src/components/scripts/RunPage/detailed';

export const getStaticPaths = staticPaths;

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

    const { tests, suites, sessions, attachments, writtenAttachments } =
        await getDrillDownResults(connection, testID);

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
            },
            testID: testID,
            port,
            attachmentPrefix: process.env.ATTACHMENTS ?? attachmentPrefix,
        },
    };
}

function ReturnChild(props: { tab: string }) {
    switch (props.tab) {
        case testEntitiesTab: {
            return <TestEntities />;
        }
        default: {
            return <></>;
        }
    }
}

export default function TestRunResults(
    props: DetailedTestRunPageProps,
): ReactNode {
    const [current, setCurrent] = useState(testEntitiesTab);
    return (
        <EnsureFallback fallbackPayload={props}>
            <DetailedTestRun
                activeTab={testEntitiesTab}
                show
                onChange={(now) => setCurrent(now)}
            >
                <ReturnChild tab={current} />
            </DetailedTestRun>
        </EnsureFallback>
    );
}
