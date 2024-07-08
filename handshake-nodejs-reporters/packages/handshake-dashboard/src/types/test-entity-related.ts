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
    title: string;
    tags: Tag[];
}

export interface SimpleSuiteDetails {
    numberOfErrors: number;
    Parent: string;
    type: suiteType;
    totalRollupValue: number;
    Desc: string;
    errors: ErrorRecord[];
    error?: ErrorRecord;
}

export interface SuiteRecordDetails
    extends RecurringFields,
        SimpleSuiteDetails {
    rollup_passed: number;
    rollup_failed: number;
    rollup_skipped: number;
    rollup_tests: number;
    hasChildSuite: boolean;
    entityName: string;
    entityVersion: string;
    hooks: number;
    simplified: string;
    numberOfAssertions?: number;
    nextSuite?: string;
    prevSuite?: string;
}

export interface TestRecordDetails extends RecurringFields, SimpleSuiteDetails {
    // broken: boolean;
    rollup_passed: number;
    rollup_failed: number;
    rollup_skipped: number;
    rollup_tests: number;
    hooks: number;
    assertions: number;
}

export interface Tag {
    name: string;
    label: string;
}
export interface AssertionRecord {
    entity_id: string;
    title: string;
    passed: boolean;
    wait: number;
    interval: number;
    message: string;
}

export interface RetriedRawRecord {
    suite_id: string;
    tests: string; // history
    length: number; // length of history
    suite: string; // suite at any point of history
    key: number; // 0 - index of that test in history
}

export interface RetriedRecord {
    suite_id: string;
    tests: string[]; // history
    length: number; // length of history
    suite: string; // suite at any point of history
    key: number; // 0 - index of that test in history
}

export interface ImageRecord {
    file: string;
    title: string;
    entity_id: string;
    description?: string;
    type: string;
    url: string;
}

export interface ErrorRecord {
    message: string;
    stack: string;
    mailedFrom?: string[];
}

export interface EntityLevelAttachments {
    written: Record<string, ImageRecord[]>;
}

export type EntityLevelAssertions = Record<string, AssertionRecord[]>;
