import type { RunStatus, statusOfEntity } from './session-records';

export default interface OnlyTestRunRecord {
    projectName: string;
    testID: string;
    standing: statusOfEntity;
    passed: number;
    failed: number;
    skipped: number;
    tests: number;
    xpassed: number;
    xfailed: number;
    duration: number;
    started: string;
    ended: string;
    retried: number;
    tags: string;
    specStructure: string;
    passedSuites: number;
    failedSuites: number;
    skippedSuites: number;
    xfailedSuites: number;
    xpassedSuites: number;
    suites: number;
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
    status: RunStatus;
    excelExport?: string;
}

export type specStructure = Record<string, specNode>;

export type specNode = {
    paths?: specStructure;
    current: string;
    suites?: number;
};

export type possibleFrameworks =
    | 'webdriverio'
    | 'mocha'
    | 'cucumber'
    | 'jasmine'
    | 'unknown'
    | 'pytest';

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
