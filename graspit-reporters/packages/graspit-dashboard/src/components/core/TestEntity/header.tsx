import type { RetriedRecords } from 'src/types/generatedResponse';
import type { SuiteRecordDetails } from 'src/types/testEntityRelated';
import { getRetriedRecords } from 'src/components/scripts/helper';
import MetaCallContext from '../TestRun/context';
import React, { useContext } from 'react';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import CaretLeftOutlined from '@ant-design/icons/CaretLeftOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import useSWR from 'swr';
import type { SuiteDetails } from 'src/types/generatedResponse';
import type { TreeSelectProps } from 'antd/lib/tree-select/index';
import { Badge } from 'antd/lib';
import { getSuites } from 'src/components/scripts/helper';
import TreeSelect from 'antd/lib/tree-select/index';
import { badgeStatus } from 'src/components/parseUtils';

export function NavigationButtons(props: {
    selectedSuite: SuiteRecordDetails;
    setTestID: (testID: string) => void;
}) {
    const { port, testID } = useContext(MetaCallContext);
    const { data: retriedRecords } = useSWR<RetriedRecords>(
        getRetriedRecords(port, testID),
    );

    const records = retriedRecords ?? {};
    const record = records[props.selectedSuite.suiteID] ?? {
        tests: [],
        length: 0,
    };

    const index = record?.tests?.indexOf(props.selectedSuite.suiteID) ?? -1;

    const prevSuite = record.tests.at(index - 1);
    const nextSuite = record.tests.at(index + 1);

    const hasPrevRetry = prevSuite != null && index > 0;
    const hasNextRetry = nextSuite != null;
    const hasParent =
        props.selectedSuite?.parent != null &&
        props.selectedSuite?.parent != '';

    return (
        <Space>
            <Button
                size="small"
                icon={<CaretLeftOutlined />}
                disabled={!hasPrevRetry}
                title={hasPrevRetry ? 'Prev Retry' : 'No Retries Found'}
                onClick={() => props.setTestID(prevSuite as string)}
            />

            <Button
                size="small"
                icon={<UpOutlined />}
                title={hasParent ? 'View Parent' : 'No Parent Entity Found  '}
                disabled={!hasParent}
                onClick={() => props.setTestID(props.selectedSuite.parent)}
            />

            <Button
                size="small"
                disabled={!hasNextRetry}
                icon={<CaretRightOutlined />}
                title={hasNextRetry ? 'Next Retry' : 'No Entities found'}
                onClick={() => props.setTestID(nextSuite as string)}
            />
        </Space>
    );
}

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

    let prev: undefined | string, next: undefined | string;

    const wasRetried = selected?.standing === 'RETRIED';
    !wasRetried &&
        suites['@order'].forEach((suite, index) => {
            const toAdd = suites[suite];
            if (toAdd.standing === 'RETRIED') return;

            const parent = parents[toAdd.parent];
            const addTo = parent == null ? data : parent;

            parents[toAdd.suiteID] = [];

            const toBe = toAdd.suiteID === props.selected;
            if (toBe) {
                prev = suites['@order'][index - 1];
                next = suites['@order'][index + 1];
            }

            addTo.push({
                value: toAdd.suiteID,
                title: toAdd.title,
                children: parents[toAdd.suiteID],
                disabled: toBe,
            });
        });
    if (wasRetried) {
        const index = suites['@order'].indexOf(props.selected ?? '');
        prev = suites['@order'][index - 1];
        next = suites['@order'][index + 1];
    }

    return (
        <Space>
            <Button
                size="small"
                icon={<CaretLeftOutlined />}
                title="Previous suite in chronological order"
                disabled={prev == null}
                onClick={() => prev && props.setTestID(prev)}
            />
            <Badge
                title={selected.standing}
                style={{ zoom: '1.5' }}
                status={badgeStatus(selected.standing)}
                dot
            >
                {wasRetried ? (
                    <Button disabled type="primary">
                        {selected.title}
                    </Button>
                ) : (
                    <TreeSelect
                        treeData={data}
                        value={props.selected}
                        title="Next suite in chronological order"
                        onSelect={(value) => props.setTestID(value)}
                        treeLine
                        dropdownStyle={{ minWidth: '350px' }}
                        style={{ minWidth: '250px' }}
                        disabled={wasRetried}
                    />
                )}
            </Badge>
            <Button
                size="small"
                icon={<CaretRightOutlined />}
                disabled={next == null}
                onClick={() => next && props.setTestID(next)}
            />
        </Space>
    );
}
