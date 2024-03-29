export function runPage(testID: string) {
    return `/RUNS/${testID}`;
}

export function detailedPage(testID: string, tab: string) {
    return `/RUNS/${testID}/detailed?tab=${tab}`;
}
