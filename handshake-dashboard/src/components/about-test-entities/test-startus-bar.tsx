import { BarChart } from '@mantine/charts';
import { Box, Group, Paper, Skeleton, Text } from '@mantine/core';
import TestStatusIcon from 'components/about-test-run/test-status';
import { jsonFeedForTests } from 'components/links';
import React from 'react';
import type { ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';
import type { SuiteRecordDetails } from 'types/test-entity-related';

export default function TestStatusBar(properties: {
    suiteID: string;
    testID: string;
}): ReactNode {
    const { data, isLoading, error } = useSWRImmutable<SuiteRecordDetails[]>(
        properties.testID && properties.suiteID
            ? jsonFeedForTests(properties.testID, properties.suiteID)
            : undefined,
        () =>
            fetch(
                jsonFeedForTests(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );
    const toLoad = isLoading || data === undefined || error != undefined;

    return toLoad ? (
        <Skeleton height={40} width="100%" />
    ) : (
        <Box pt={2} pr={'md'} style={{ flexGrow: 1 }}>
            <BarChart
                h={35}
                gridAxis="none"
                maw={'100%'}
                data={data.map((test) => ({
                    test: test.title,
                    passed: test.standing === 'PASSED' ? 1 : 0,
                    skipped: test.standing === 'SKIPPED' ? 1 : 0,
                    failed: test.standing === 'FAILED' ? 1 : 0,
                    standing: test.standing,
                }))}
                ml="auto"
                dataKey="test"
                type="stacked"
                series={[
                    { name: 'passed', color: 'green.6' },
                    { name: 'failed', color: 'red.6' },
                    { name: 'skipped', color: 'yellow.6' },
                ]}
                withXAxis={false}
                withYAxis={false}
                barProps={{ radius: 10 }}
                tooltipProps={{
                    position: { y: 40 },
                    content: ({ label, payload }) => (
                        <Paper shadow="xl" withBorder p="sm">
                            <Group wrap="nowrap" align="center">
                                <TestStatusIcon
                                    status={
                                        payload?.at(0)?.payload?.standing ??
                                        'PENDING'
                                    }
                                />
                                <Text size="xs">{label}</Text>
                            </Group>
                        </Paper>
                    ),
                }}
                withBarValueLabel={false}
            />
        </Box>
    );
}
