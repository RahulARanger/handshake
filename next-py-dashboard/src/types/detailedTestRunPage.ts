import type DetailsOfRun from "./testRun";
import { type TestRunSummary } from "./testRun";

export interface ShareToOtherPages {
    test_id: string;
    port: string;
}

export interface DetailedTestRunPageProps extends ShareToOtherPages {
    fallback: Record<
        string,
        DetailsOfRun | TestRunSummary | SuiteDetails | TestDetails
    >;
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
    description: string;
    file: string;
    parent: string;
    suiteType: "SUITE" | "TEST";
    error: Error;
    errors: Error[];
}

interface Order {
    "@order": string[];
}

export type SuiteDetails = Order & Record<string, SuiteRecordDetails>;

export type TestDetails = Record<string, SuiteRecordDetails[]>;
