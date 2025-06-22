import { useMemo } from 'react';
import { ParsedSuiteRecord } from 'types/parsed-records';

export interface SearchQuery {
    search: string;
    parent: string;
    levels: Array<{ label: string; value: string }>;
}
export const DEFAULT_QUERY: SearchQuery = {
    search: '',
    parent: '',
    levels: [{ label: '***', value: '' }],
};

export default function useFilteredSuites(
    searchQuery: SearchQuery,
    suites?: ParsedSuiteRecord[],
    allRecords?: ParsedSuiteRecord[],
) {
    const filteredSuites = useMemo(() => {
        const compounded = (allRecords ?? [])?.length > 0 ? allRecords : suites;
        if (!compounded) return [];
        const p_compounded = compounded.filter(
            (suite) => suite.Parent === searchQuery.parent,
        );
        return p_compounded;
    }, [suites, allRecords, searchQuery]);

    return { filteredSuites };
}
