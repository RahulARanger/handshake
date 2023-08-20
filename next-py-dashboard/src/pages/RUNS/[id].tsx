import { getSuites, getTestRun, getTestRuns } from "@/components/helper";
import { type DetailedTestRunPageProps } from "@/types/detailedTestRunPage";
import React from "react";
import { type GetStaticPathsResult, type GetStaticPropsResult } from "next";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import TestRunHeader from "@/components/Header";
import Stack from "@mui/material/Stack";
import { DetailedTestResults } from "@/components/DetailedTestResults";

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
    const resp = await fetch(getTestRuns(), { method: "GET" });
    return {
        paths: (await resp.json()).slice(0, 1).map((id: string) => ({
            params: {
                id,
            },
        })),
        fallback: false,
    };
}

export async function getStaticProps(prepareProps: {
    params: {
        id: string;
    };
}): Promise<GetStaticPropsResult<DetailedTestRunPageProps>> {
    const testID = prepareProps.params.id;
    const runURL = getTestRun(testID);
    const resp = await fetch(runURL, {
        method: "GET",
    });

    if (resp.status === 400) {
        return {
            redirect: {
                permanent: true,
                destination: "/RUNS/no-test-run-found",
            },
        };
    }

    const getSuitesURL = getSuites(testID);
    const suites = await fetch(getSuitesURL, { method: "GET" });

    return {
        props: {
            fallback: {
                [runURL]: await resp.json(),
                [getSuitesURL]: await suites.json(),
            },
            test_id: testID,
            getTestRun: runURL,
            getSuites: getSuitesURL,
        },
    };
}

export default function TestRunResults(
    props: DetailedTestRunPageProps
): ReactNode {
    const fallback = props.fallback;
    return (
        <SWRConfig value={{ fallback }}>
            <Stack display="flex" flexDirection="column" height="100%">
                <TestRunHeader
                    getTestRun={props.getTestRun}
                    getSuites={props.getSuites}
                ></TestRunHeader>
                <DetailedTestResults
                    getTestRun={props.getTestRun}
                    getSuites={props.getSuites}
                />
            </Stack>
        </SWRConfig>
    );
}
