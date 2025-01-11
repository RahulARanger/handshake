export type possibleEntityNames =
    | 'chrome'
    | 'firefox'
    | 'safari'
    | 'edge'
    | 'chrome-headless-shell'
    | 'others';

export type statusOfEntity =
    | 'PASSED'
    | 'FAILED'
    | 'PENDING'
    | 'SKIPPED'
    | 'RETRIED'
    | 'XFAILED'
    | 'XPASSED';

export type RunStatus =
    | 'COMPLETED'
    | 'INTERRUPTED'
    | 'INTERNAL_ERROR'
    | 'SKIPPED';
