import React, { useMemo, useState } from 'react';
import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { Button, ScrollAreaAutosize, Timeline } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DetailedTestRecord } from 'types/parsed-records';
import TestRunCard from 'components/about-test-runs/run-card';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import TestStatusIcon from '../about-test-run/test-status';

dayjs.extend(advancedFormat);

export function ListOfRuns(properties: {
    runs: DetailedTestRecord[];
    mah: ScrollAreaAutosizeProps['mah'];
    pageSize?: number;
}): ReactNode {
    const [currentPage, setCurrentPage] = useState(1);

    const slicesRuns = useMemo(() => {
        const pageSize = properties.pageSize ?? 9;
        return properties.runs.slice(0, pageSize * currentPage);
    }, [currentPage, properties.runs, properties.pageSize]);

    return (
        <ScrollAreaAutosize
            mah={properties.mah}
            style={{ overflowX: 'hidden' }}
        >
            <Timeline color="gray.8" active={properties.runs.length - 1}>
                {slicesRuns.map((run) => (
                    <Timeline.Item
                        key={run.Id}
                        bullet={<TestStatusIcon status={run.Status} />}
                    >
                        <TestRunCard run={run} />
                    </Timeline.Item>
                ))}
                {properties.runs.length > slicesRuns.length ? (
                    <Timeline.Item>
                        <Button
                            variant="light"
                            onClick={() => {
                                setCurrentPage(currentPage + 1);
                            }}
                        >
                            Show More
                        </Button>
                    </Timeline.Item>
                ) : (
                    <></>
                )}
            </Timeline>
        </ScrollAreaAutosize>
    );
}
