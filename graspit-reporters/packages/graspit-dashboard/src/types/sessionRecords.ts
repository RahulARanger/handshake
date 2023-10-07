export type possibleBrowserNames =
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
}

export default interface SessionRecordDetails extends RecurringFields {
    sessionID: string;
    browserVersion: string;
    browserName: possibleBrowserNames;
    simplified: string;
    specs: string[];
    hooks: number;
    test_id: string;
}
