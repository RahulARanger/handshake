import { getSuites, getTestRun, getTestRunSummary } from "@/Generators/helper";
import { type DetailedTestRunPageProps } from "@/types/detailedTestRunPage";
import React from "react";
import { type GetStaticPathsResult, type GetStaticPropsResult } from "next";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import TestRunHeader from "@/components/Header";
import { DetailedTestResults } from "@/components/DetailedTestResults";
import { getLogger } from "log4js";
import getConnection from "@/Generators/dbConnection";
import {
    generateTestRunSummary,
    getAllTestRuns,
    getDetailsOfTestRun,
} from "@/Generators/Queries/testRunRelated";
import getAllSuites from "@/Generators/Queries/testEntityRelated";

const logger = getLogger("TestRunRelated");

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
    logger.info("📃 Fetching list of test runs...");
    const connection = await getConnection();
    const paths = await getAllTestRuns(connection);
    await connection.close();

    logger.info("✅ Test Runs generated");

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
    logger.info("Generating Details for a test Run 💼");

    const testID = prepareProps.params.id;

    const connection = await getConnection();
    const details = await getDetailsOfTestRun(connection, testID);
    if (details == null) {
        return {
            redirect: {
                permanent: true,
                destination: "/RUNS/no-test-run-found",
            },
        };
    }
    const suites = await getAllSuites(connection, testID);
    await connection.close();

    return {
        props: {
            fallback: {
                [getTestRun(testID)]: details,
                [getSuites(testID)]: suites,
                [getTestRunSummary(testID)]: generateTestRunSummary(details),
            },
            test_id: testID,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps
): ReactNode {
    const fallback = props.fallback;
    return (
        <SWRConfig value={{ fallback }}>
            <TestRunHeader test_id={props.test_id} />
            <DetailedTestResults test_id={props.test_id} />
        </SWRConfig>
    );
}
