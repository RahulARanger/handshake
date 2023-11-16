import type { SuiteDetails } from 'src/types/generatedResponse';
import type { TreeSelectProps } from 'antd/lib/tree-select/index';
import React, { useContext } from 'react';
import MetaCallContext from '../TestRun/context';
import useSWR from 'swr';
import { Badge } from 'antd/lib';
import { getSuites } from 'src/components/scripts/helper';
import TreeSelect from 'antd/lib/tree-select/index';
import { badgeStatus } from 'src/components/parseUtils';
import Typography from 'antd/lib/typography/Typography';

export default function TreeSelectionOfSuites(props: {
    selected?: string;
    setTestID: (testID: string) => void;
}) {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const parents: Record<string, TreeSelectProps['treeData']> = {};
    const data: TreeSelectProps['treeData'] = [];

    if (suites == null) return <></>;

    const selected = suites[props?.selected ?? ''];
    if (selected?.standing === 'RETRIED')
        return <Typography>{selected.title}</Typography>;

    suites['@order'].forEach((suite) => {
        const toAdd = suites[suite];
        if (toAdd.standing === 'RETRIED') return;

        const parent = parents[toAdd.parent];
        const addTo = parent == null ? data : parent;

        parents[toAdd.suiteID] = [];

        addTo.push({
            value: toAdd.suiteID,
            title: toAdd.title,
            children: parents[toAdd.suiteID],
            disabled: toAdd.suiteID === props.selected,
        });
    });

    return (
        <Badge
            title={selected.standing}
            style={{ zoom: '1.5' }}
            status={badgeStatus(selected.standing)}
            dot
        >
            <TreeSelect
                treeData={data}
                value={props.selected}
                onSelect={(value) => props.setTestID(value)}
                treeLine
                dropdownStyle={{ minWidth: '350px' }}
                style={{ minWidth: '250px' }}
            />
        </Badge>
    );
}
