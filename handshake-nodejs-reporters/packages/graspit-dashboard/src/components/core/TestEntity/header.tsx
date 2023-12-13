import type { RetriedRecords } from 'src/types/generated-response';
import type { SuiteRecordDetails } from 'src/types/test-entity-related';
import { getRetriedRecords } from 'src/components/scripts/helper';
import MetaCallContext from '../TestRun/context';
import React, { useContext } from 'react';
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined';
import CaretLeftOutlined from '@ant-design/icons/CaretLeftOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button/button';
import useSWR from 'swr';
import type { SuiteDetails } from 'src/types/generated-response';
import type { TreeSelectProps } from 'antd/lib/tree-select/index';
import { Badge } from 'antd/lib';
import { getSuites } from 'src/components/scripts/helper';
import TreeSelect from 'antd/lib/tree-select/index';
import { badgeStatus } from 'src/components/parse-utils';

export function NavigationButtons(properties: {
    selectedSuite: SuiteRecordDetails;
    setTestID: (testID: string) => void;
}) {
    const { port, testID } = useContext(MetaCallContext);
    const { data: retriedRecords } = useSWR<RetriedRecords>(
        getRetriedRecords(port, testID),
    );

    const records = retriedRecords ?? {};
    const record = records[properties.selectedSuite.suiteID] ?? {
        tests: [],
        length: 0,
    };

    const index =
        record?.tests?.indexOf(properties.selectedSuite.suiteID) ?? -1;

    const previousSuite = record.tests.at(index - 1);
    const nextSuite = record.tests.at(index + 1);

    const hasPreviousRetry = previousSuite != undefined && index > 0;
    const hasNextRetry = nextSuite != undefined;
    const hasParent =
        properties.selectedSuite?.parent != undefined &&
        properties.selectedSuite?.parent != '';

    return (
        <Space>
            <Button
                size="small"
                icon={<CaretLeftOutlined />}
                disabled={!hasPreviousRetry}
                title={hasPreviousRetry ? 'Prev Retry' : 'No Retries Found'}
                onClick={() => properties.setTestID(previousSuite as string)}
            />

            <Button
                size="small"
                icon={<UpOutlined />}
                title={hasParent ? 'View Parent' : 'No Parent Entity Found  '}
                disabled={!hasParent}
                onClick={() =>
                    properties.setTestID(properties.selectedSuite.parent)
                }
            />

            <Button
                size="small"
                disabled={!hasNextRetry}
                icon={<CaretRightOutlined />}
                title={hasNextRetry ? 'Next Retry' : 'No Entities found'}
                onClick={() => properties.setTestID(nextSuite as string)}
            />
        </Space>
    );
}

export default function TreeSelectionOfSuites(properties: {
    selected?: string;
    setTestID: (testID: string) => void;
}) {
    const { port, testID } = useContext(MetaCallContext);
    const { data: suites } = useSWR<SuiteDetails>(getSuites(port, testID));
    const parents: Record<string, TreeSelectProps['treeData']> = {};
    const data: TreeSelectProps['treeData'] = [];

    if (suites == undefined) return <></>;

    const selected = suites[properties?.selected ?? ''];

    let previous: undefined | string, next: undefined | string;

    const wasRetried = selected?.standing === 'RETRIED';
    !wasRetried &&
        // eslint-disable-next-line unicorn/no-array-for-each
        suites['@order'].forEach((suite, index) => {
            const toAdd = suites[suite];
            if (toAdd.standing === 'RETRIED') return;

            const parent = parents[toAdd.parent];
            const addTo = parent == undefined ? data : parent;

            parents[toAdd.suiteID] = [];

            const toBe = toAdd.suiteID === properties.selected;
            if (toBe) {
                previous = suites['@order'][index - 1];
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
        const index = suites['@order'].indexOf(properties.selected ?? '');
        previous = suites['@order'][index - 1];
        next = suites['@order'][index + 1];
    }

    return (
        <Space>
            <Button
                size="small"
                icon={<CaretLeftOutlined />}
                title="Previous suite in chronological order"
                disabled={previous == undefined}
                onClick={() => previous && properties.setTestID(previous)}
            />
            <Badge
                title={selected.standing}
                style={{ zoom: '1.5' }}
                status={badgeStatus(selected.standing)}
                dot
            >
                {wasRetried ? (
                    <Button
                        disabled
                        type="primary"
                        style={{ minWidth: '250px', maxWidth: '450px' }}
                    >
                        {selected.title}
                    </Button>
                ) : (
                    <TreeSelect
                        treeData={data}
                        value={properties.selected}
                        title="Next suite in chronological order"
                        onSelect={(value) => properties.setTestID(value)}
                        treeLine
                        dropdownStyle={{ minWidth: '350px' }}
                        style={{ minWidth: '250px', maxWidth: '450px' }}
                        disabled={wasRetried}
                    />
                )}
            </Badge>
            <Button
                size="small"
                icon={<CaretRightOutlined />}
                disabled={next == undefined}
                onClick={() => next && properties.setTestID(next)}
            />
        </Space>
    );
}
