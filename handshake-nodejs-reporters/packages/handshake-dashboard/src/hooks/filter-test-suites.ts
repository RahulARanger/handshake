import { useMemo, useState } from 'react';
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

export default function useFilteredSuites(suites?: ParsedSuiteRecord[]) {
    const [searchQuery, setSearchQuery] = useState<SearchQuery>(DEFAULT_QUERY);

    const filteredSuites = useMemo(() => {
        if (!suites) return [];
        const p_suites = suites.filter(
            (suite) => suite.Parent === searchQuery.parent,
        );
        return p_suites;
    }, [suites, searchQuery]);

    return { filteredSuites, searchQuery, setSearchQuery };
}
