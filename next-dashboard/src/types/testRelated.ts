export default interface Suite {
    // can be scenario or suite
    id: string;
    labels: string[];
    parent: string;
    title: string;
    file: string;
    error?: string;
    startedAt: string;
    completedAt?: string;
    duration?: number;
    isExecuting?: boolean;
    retriesDone?: number;
    result?: "PASSED" | "FAILED" | "SKIPPED" | "RUNNING";
    passed?: number;
    failed?: number;
    skipped?: number;
    testCount?: number;
    severityStatus?: "CRITICAL" | "MAJOR" | "MINOR";
    tests: Test[] | Suite[];
    suites: Test[] | Suite[];
}

export interface Test extends Suite {
    timedOut: boolean;
    name?: string;
    description?: string;
}
