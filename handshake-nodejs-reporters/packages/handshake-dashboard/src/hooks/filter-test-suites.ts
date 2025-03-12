import { useMemo, useState } from 'react';
import { ParsedSuiteRecord } from 'types/parsed-records';
import { statusOfEntity } from 'types/session-records';

export interface SearchQuery {
    search: string;
    parent: string;
    status?: statusOfEntity[];
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
        // console.log(toLoad, suites, 'here');
        if (!suites) return [];
        const p_suites = suites.filter(
            (suite) => suite.Parent === searchQuery.parent,
        );

        // if (searchQuery.status)
        //     p_suites = suites.filter((suite) =>
        //         searchQuery.status.includes(suite.Status),
        //     );
        return p_suites;
    }, [suites, searchQuery]);

    return { filteredSuites, searchQuery, setSearchQuery };
}
