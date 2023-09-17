import { type statusOfEntity } from "./detailedTestRunPage";

export default interface DetailsOfRun {
    projectName: string;
    testID: string;
    standing: statusOfEntity;
    passed: number;
    failed: number;
    skipped: number;
    tests: number;
    duration: number;
    started: string;
    ended: string;
    retried: number;
    tags: string[];
    suitesConfig: string[];
    specs: string[];
    suiteSummary: string;
}

export interface SuiteSummary {
    passed: number;
    skipped: number;
    count: number;
    failed: number;
}

export interface TestRunSummary {
    TESTS: {
        passed: number;
        failed: number;
        skipped: number;
        tests: number;
    };
    SUITES: {
        passed: number;
        failed: number;
        skipped: number;
        count: number;
    };
    RETRIED: number;
}
