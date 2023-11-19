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
