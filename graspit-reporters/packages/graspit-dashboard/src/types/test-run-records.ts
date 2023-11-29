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

export interface TestRunConfig {
    attachmentValue: string;
    description: string;
    type: 'CONFIG' | 'ERROR';
    test_id: string;
}

export interface AttachmentValueForConfig {
    platformName: string;
    version: string;
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
