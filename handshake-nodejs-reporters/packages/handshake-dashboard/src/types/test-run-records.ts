import type { statusOfEntity } from './session-records';

export default interface OnlyTestRunRecord {
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
    tags: string;
    specStructure: string;
    suiteSummary: string;
    framework: string;
}
export interface TestRunRecord extends OnlyTestRunRecord {
    platform: string;
    framework: string;
    maxInstances: number;
    exitCode: number;
    fileRetries: number;
    avoidParentSuitesInCount: boolean;
    bail: number;
    timelineIndex: number; // 1 - indexed
    projectIndex: number; // 1 - indexed
}

export type specStructure = Record<string, specNode>;

export type specNode = {
    paths?: specStructure;
    current: string;
    suites?: number;
};

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

export interface Project {
    duration: number;
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
    passedSuites: number;
    failedSuites: number;
    skippedSuites: number;
    testID: string;
    suites: number;
}

export type Projects = Record<string, Project[]>;
