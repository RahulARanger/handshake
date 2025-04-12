import { jsonFeedForListOfSuites, jsonFeedForTests } from 'components/links';
import transformSuiteEntity, {
    spawnConverterForAnsiToHTML,
} from 'extractors/transform-test-entity';
import { useMemo } from 'react';
import useSWRImmutable from 'swr';
import { SuiteRecordDetails } from 'types/test-entity-related';

export function useProcessedTestSuites(
    mockSuites?: SuiteRecordDetails[],
    testID?: string,
    tests?: number,
) {
    const {
        data: _data,
        isLoading,
        error,
    } = useSWRImmutable<SuiteRecordDetails[]>(
        testID && !mockSuites ? jsonFeedForListOfSuites(testID) : undefined,
        () =>
            fetch(jsonFeedForListOfSuites(testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const data = _data ?? mockSuites;

    const suites = useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        return (data ?? [])
            .filter((suite) => suite.standing !== 'RETRIED')
            .map((suite) => transformSuiteEntity(suite, tests ?? 0, converter));
    }, [tests, data]);

    return { suites, isLoading, error };
}

export function useProcessedTestCases(
    mockTests?: SuiteRecordDetails[],
    testID?: string,
    suiteID?: string,
    testsCount?: number,
) {
    const {
        data: _data,
        isLoading,
        error,
    } = useSWRImmutable<SuiteRecordDetails[]>(
        testID && suiteID && !mockTests
            ? jsonFeedForTests(testID, suiteID)
            : undefined,
        () =>
            fetch(jsonFeedForTests(testID as string, suiteID as string)).then(
                async (response) => response.json(),
            ),
    );
    const data = _data ?? mockTests;

    const tests = useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        return (data ?? [])
            .filter((test) => test.standing !== 'RETRIED')
            .map((test) =>
                transformSuiteEntity(test, testsCount ?? 0, converter),
            );
    }, [data]);

    return { tests, isLoading, error };
}
