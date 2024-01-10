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
    error: string;
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
    error: string;
    entityName: string;
    entityVersion: string;
    simplified: string;
    Parent: string;

    hooks: number;
}

export interface SuiteRecordDetails
    extends RecurringFields,
        SimpleSuiteDetails {
    rollup_passed: number;
    rollup_failed: number;
    rollup_skipped: number;
    rollup_tests: number;
}

export interface TestRecordDetails extends RecurringFields {
    broken: boolean;
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
    tests: string[];
    length: number;
}

export interface ImageRecord {
    path: string;
    title: string;
    description?: string;
}
