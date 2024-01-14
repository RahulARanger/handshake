import type { statusOfEntity } from './session-records';

export type suiteType = 'SUITE' | 'TEST';
export interface RecurringFields {
    started: string;
    ended: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    retried: number;
    standing: statusOfEntity;
    tests: number;
    numberOfErrors: number;
    suiteID: string;
    session_id: string;
    description: string;
    file: string;
    parent: string;
    suiteType: suiteType;
    errors: string;
    title: string;
    tags: string;
}

export interface SimpleSuiteDetails {
    numberOfErrors: number;
    Parent: string;
    type: suiteType;
    Desc: string;
}

export interface SuiteRecordDetails
    extends RecurringFields,
        SimpleSuiteDetails {
    rollup_passed: number;
    rollup_failed: number;
    rollup_skipped: number;
    rollup_tests: number;
    entityName: string;
    entityVersion: string;
    error: string;
    hooks: number;
    simplified: string;
}

export interface TestRecordDetails extends RecurringFields {
    broken: boolean;
    error: string;
}

export interface Tag {
    name: string;
    id: string;
    location: { line: number; column: number };
    astNodeId: string;
}
export interface AssertionRecord {
    entity_id: string;
    title: string;
    passed: boolean;
    wait: number;
    interval: number;
    message: string;
}

export interface RetriedRecord {
    suite_id: string;
    tests: string; // history
    length: number; // length of history
    test: string; // suite at any point of history
    key: number; // 0 - index of that test in history
}

export interface ImageRecord {
    path: string;
    title: string;
    entity_id: string;
    description?: string;
}

export interface ErrorRecord {
    message: string;
    stack: string;
    mailedFrom: string[];
}
