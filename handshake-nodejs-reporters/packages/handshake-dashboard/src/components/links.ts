export function runsPage() {
    return '/RUNS';
}

export function testRunPage(testID: string) {
    return `/RUNS/Overview?testID=${testID}`;
}

export function suitesPage(testID: string) {
    return `/RUNS/Suites?testID=${testID}`;
}

export function jsonFeedForRunsPage() {
    return process.env.IS_DEV ? '/api/Import/runs.json' : '/Import/runs.json';
}

export function jsonFeedForProjects() {
    return process.env.IS_DEV
        ? '/api/Import/projects.json'
        : '/Import/projects.json';
}

export function jsonFeedAboutTestRun(testID: string) {
    return process.env.IS_DEV
        ? `/api/Import/Runs/${testID}/run.json`
        : `/Import/${testID}/run.json`;
}

export function jsonFeedForOverviewOfTestRun(testID: string) {
    return process.env.IS_DEV
        ? `/api/Import/Runs/${testID}/overview.json`
        : `/Import/${testID}/overview.json`;
}
