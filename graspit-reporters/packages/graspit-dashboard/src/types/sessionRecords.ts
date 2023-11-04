export type possibleEntityNames =
    | 'chrome'
    | 'firefox'
    | 'safari'
    | 'edge'
    | 'others';

export type statusOfEntity = 'PASSED' | 'FAILED' | 'PENDING' | 'SKIPPED';

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

    rollup_tests?: number;
    rollup_passed?: number;
    rollup_failed?: number;
    rollup_skipped?: number;
}

export default interface SessionRecordDetails extends RecurringFields {
    sessionID: string;
    entityVersion: string;
    entityName: possibleEntityNames;
    simplified: string;
    specs: string[];
    hooks: number;
    test_id: string;
}
