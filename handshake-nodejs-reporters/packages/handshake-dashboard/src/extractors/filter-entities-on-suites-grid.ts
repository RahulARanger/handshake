import type { ParsedSuiteRecord } from 'types/parsed-records';

export default function filterListOfSuites(
    suites: ParsedSuiteRecord[],
    query: { parentSuite?: string; searchString?: string },
): ParsedSuiteRecord[] {
    return suites.filter(
        (suite) =>
            suite.Status !== 'RETRIED' && suite.Parent === query.parentSuite,
    );
}
