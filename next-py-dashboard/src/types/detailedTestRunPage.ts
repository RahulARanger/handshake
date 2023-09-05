import type DetailsOfRun from "./testRun";
import { type TestRunSummary } from "./testRun";

export interface ShareToOtherPages {
    test_id: string;
}

export interface DetailedTestRunPageProps extends ShareToOtherPages {
    fallback: Record<string, DetailsOfRun | TestRunSummary | SuiteDetails>;
}

export interface OverviewPageProps extends ShareToOtherPages {}

export type statusOfEntity = "PASSED" | "FAILED" | "PENDING" | "SKIPPED";

export interface SuiteRecordDetails {
    title: string;
    fullTitle: string;
    suiteID: string;
    started: string;
    ended: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    retried: number;
    standing: statusOfEntity;
    tests: number;
}

export type SuiteDetails = Record<string, string[] | SuiteRecordDetails>;
