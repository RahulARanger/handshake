import React from 'react';
import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { ScrollAreaAutosize, Timeline } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DetailedTestRecord } from 'types/parsed-records';
import TestRunCard from 'components/about-test-run/run-card';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import TestStatusIcon from './test-status';

dayjs.extend(advancedFormat);

export function ListOfRuns(properties: {
    runs: DetailedTestRecord[];
    mah: ScrollAreaAutosizeProps['mah'];
}): ReactNode {
    return (
        <ScrollAreaAutosize mah={properties.mah}>
            <Timeline color="gray.8" active={properties.runs.length - 1}>
                {properties.runs.map((run) => (
                    <Timeline.Item
                        key={run.Id}
                        bullet={<TestStatusIcon status={run.Status} />}
                    >
                        <TestRunCard run={run} />
                    </Timeline.Item>
                ))}
            </Timeline>
        </ScrollAreaAutosize>
    );
}
