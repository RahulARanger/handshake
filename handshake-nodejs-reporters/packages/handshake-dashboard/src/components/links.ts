export function runPage(testID: string) {
    return `/RUNS/${testID}`;
}

export function detailedPage(testID: string, parameters: string) {
    return `/RUNS/${testID}/detailed?tab=${parameters}`;
}
