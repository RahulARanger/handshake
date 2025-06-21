import { MRT_VisibilityState } from 'mantine-react-table';
import { useEffect, useRef, useState } from 'react';

export interface ListOfSuitesConfiguration {
    showHideColumns: MRT_VisibilityState;
}

const filtersAppliedForListOfSuites = 'mrt_columnVisibility_listOfSuites';

function saveFiltersAppliedForListOfSuites(state: MRT_VisibilityState) {
    sessionStorage.setItem(
        filtersAppliedForListOfSuites,
        JSON.stringify(state),
    );
}

export default function useTableConfigurationsForListOfSuites() {
    const [columnsShown, setColumnsShown] = useState<MRT_VisibilityState>({});
    const isFirstRender = useRef(true);

    useEffect(() => {
        const columnVisibility = sessionStorage.getItem(
            filtersAppliedForListOfSuites,
        );

        if (columnVisibility)
            setColumnsShown(
                JSON.parse(columnVisibility) as MRT_VisibilityState,
            );

        isFirstRender.current = false;
    }, []);

    useEffect(() => {
        if (isFirstRender.current) return;
        saveFiltersAppliedForListOfSuites(columnsShown);
    }, [columnsShown]);

    return { columnsShown, setColumnsShown };
}
