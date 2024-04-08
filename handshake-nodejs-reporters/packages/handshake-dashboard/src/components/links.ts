export function runPage(testID: string) {
    return `/RUNS/${testID}`;
}

export function detailedPage(testID: string, tab: string) {
    return `/RUNS/${testID}/detailed?tab=${tab}`;
}

export function jsonFeedForRunsPage() {
    return process.env.IS_DEV ? '/api/Import/runs.json' : '/Import/runs.json';
}
