import type DetailsOfRun from "./testRun";

export interface ShareToOtherPages {
    getTestRun: string;
    getSuites: string
}

export interface DetailedTestRunPageProps extends ShareToOtherPages {
    test_id: string;
    fallback: Record<string, DetailsOfRun>;
}

export interface OverviewPageProps extends ShareToOtherPages {}

export interface SuiteDetails{
    title: string;
    fullTitle: string;
    "suiteID": string,
    "started": string,
    "ended": string,
    "passed": number,
    "failed": number,
    "skipped": number,
    "duration": number,
    "retried": number,
    "standing": "PASSED" | "FAILED" | "PENDING"
}