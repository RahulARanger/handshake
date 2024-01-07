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
    | 'WDIO-Mocha'
    | 'WDIO-Cucumber'
    | 'WDIO-Jasmine';

export interface TestRunConfig {
    platform: string;
    framework: possibleFrameworks;
    maxInstances: number;
    exitCode: number;
    fileRetries: number;
    avoidParentSuitesInCount: number;
    bail: number;
    test_id: string;
}

export interface AttachmentValueForConfig {
    platformName: string;
    version: string;
}
