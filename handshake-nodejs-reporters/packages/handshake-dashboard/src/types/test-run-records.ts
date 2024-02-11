import type { statusOfEntity } from './session-records';

export default interface TestRunRecord {
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
    specStructure: string;
    suiteSummary: string;
    suites: number;
    passedSuites: number;
    failedSuites: number;
    skippedSuites: number;
}

export interface TestRecord extends TestRunRecord {
    framework: string;
    frameworks: possibleFrameworks[];
}

export type specNode = {
    '<path>': string;
} & { [key: string]: specNode };

export interface SuiteSummary {
    passed: number;
    skipped: number;
    count: number;
    failed: number;
}

export type possibleFrameworks =
    | 'webdriverio'
    | 'mocha'
    | 'cucumber'
    | 'jasmine'
    | 'unknown';

export type logTypes = 'WARN' | 'INFO' | 'ERROR';
export interface TestRunConfig {
    platform: string;
    framework: string;
    maxInstances: number;
    exitCode: number;
    fileRetries: number;
    avoidParentSuitesInCount: boolean;
    bail: number;
    test_id: string;
    frameworks: possibleFrameworks[];
}
