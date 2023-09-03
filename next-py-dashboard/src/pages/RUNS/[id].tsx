import {
    getSuites,
    getTestRun,
    getTestRunSummary,
    getTestRuns,
} from "@/components/helper";
import { type DetailedTestRunPageProps } from "@/types/detailedTestRunPage";
import React from "react";
import { type GetStaticPathsResult, type GetStaticPropsResult } from "next";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import TestRunHeader from "@/components/Header";
import Stack from "@mui/material/Stack";
import { DetailedTestResults } from "@/components/DetailedTestResults";
import pino from "pino";

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
    const resp = await fetch(getTestRuns(), { method: "GET" });
    const testIDS = await resp.json();
    const paths = testIDS.map((id: string) => ({ params: { id } }));

    return {
        paths,
        fallback: false,
    };
}

export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedTestRunPageProps>> {
    const logger = pino({ name: "Get Test Run Page" });

    const testID = prepareProps.params.id;
    const runURL = getTestRun(testID);
    const runSummaryURL = getTestRunSummary(testID);
    const getSuitesURL = getSuites(testID);

    const runDetails = await fetch(runURL, { method: "GET" });

    if (runDetails.status === 400) {
        logger.error({}, `Failed to the test id: ${testID}`);
        return {
            redirect: {
                permanent: true,
                destination: "/RUNS/no-test-run-found",
            },
        };
    }

    const suites = await fetch(getSuitesURL, { method: "GET" });
    const runSummary = await fetch(runSummaryURL, { method: "GET" });

    const runDetailsJSON = await runDetails.json();
    logger.info(runDetailsJSON, "Fetching details of the Test Run");

    const suitesJSON = await suites.json();
    logger.info(suitesJSON, "Fetching details of the Test Run's Suites");

    const runSummaryJSON = await runSummary.json();
    logger.info(runSummaryJSON, "Fetching details of the Test Run's Summary");

    return {
        props: {
            fallback: {
                [runURL]: runDetailsJSON,
                [getSuitesURL]: suitesJSON,
                [runSummaryURL]: runSummaryJSON,
            },
            test_id: testID,
            getTestRun: runURL,
            getSuites: getSuitesURL,
            runSummary: runSummaryURL,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps
): ReactNode {
    const fallback = props.fallback;
    return (
        <SWRConfig value={{ fallback }}>
            <TestRunHeader
                getTestRun={props.getTestRun}
                getSuites={props.getSuites}
                runSummary={props.runSummary}
            />
            <DetailedTestResults
                getTestRun={props.getTestRun}
                getSuites={props.getSuites}
                runSummary={props.runSummary}
            />
        </SWRConfig>
    );
}
