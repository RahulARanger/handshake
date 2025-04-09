import { jsonFeedAboutTestRun } from 'components/links';
import transformTestRunRecord from 'extractors/transform-run-record';
import { useMemo } from 'react';
import useSWRImmutable from 'swr';
import { TestRunRecord } from 'types/test-run-records';

export function useProcessedTestRun(properties_: {
    mockRun?: TestRunRecord;
    testID?: string;
}) {
    const {
        data: _rawRun,
        isLoading,
        error,
    } = useSWRImmutable<TestRunRecord>(
        properties_.testID && !properties_.mockRun
            ? jsonFeedAboutTestRun(properties_.testID)
            : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(properties_.testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const rawRun = _rawRun ?? properties_.mockRun;

    const run = useMemo(
        () => rawRun && transformTestRunRecord(rawRun),
        [rawRun],
    );
    return { run, isLoading, error };
}
