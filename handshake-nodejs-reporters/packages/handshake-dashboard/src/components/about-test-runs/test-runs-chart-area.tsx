import type { ScrollAreaAutosizeProps } from '@mantine/core';
import { Card, Stack, rem, Group, Switch, Text, Skeleton } from '@mantine/core';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { DetailedTestRecord } from 'types/parsed-records';
import AreaChartForTestRuns from './area-test-runs';
import SwitchTestCases from 'components/test-case-switch';
import AreaWithTestRunDuration from './test-runs-duration';

export default function TestRunsChartArea(properties: {
    runs: DetailedTestRecord[];
    h?: ScrollAreaAutosizeProps['h'];
    chartWidth?: string;
    toLoad?: boolean;
}): ReactNode {
    const [switchOption, setSwitchOption] = useState<{
        showTests: boolean;
        showPercentStack: boolean;
    }>({ showTests: false, showPercentStack: false });
    const toLoad = Boolean(properties.toLoad);
    return (
        <Stack pr="xs" pb="sm">
            <Card p="lg" shadow="lg" withBorder>
                <Card.Section withBorder p={0}>
                    <Group justify="space-between" p="xs">
                        <Text size="sm">Status of our Test Runs</Text>
                        <Group>
                            <SwitchTestCases
                                isDefaultTestCases={switchOption.showTests}
                                onChange={(_) =>
                                    setSwitchOption({
                                        ...switchOption,
                                        showTests: _,
                                    })
                                }
                                size={'sm'}
                            />
                            <Switch
                                styles={{
                                    track: { width: rem(50) },
                                    trackLabel: {
                                        paddingInline: rem(10),
                                        fontSize: rem(8),
                                    },
                                }}
                                onLabel="%"
                                offLabel="Values"
                                size={'sm'}
                                onChange={(_) =>
                                    setSwitchOption({
                                        ...switchOption,
                                        showPercentStack:
                                            _.currentTarget.checked,
                                    })
                                }
                            />
                        </Group>
                    </Group>
                </Card.Section>
                <Card.Section pt={'xs'} pr={'xs'} ml={-18}>
                    {toLoad ? (
                        <Skeleton w={'100%'} h={300} animate />
                    ) : (
                        <AreaChartForTestRuns
                            Rates={properties.runs.map((run) => ({
                                rate: switchOption.showTests
                                    ? run.Rate
                                    : run.SuitesSummary,
                                date: run.Started,
                                id: run.Id,
                            }))}
                            w={properties.chartWidth ?? '60vw'}
                            percentStack={switchOption.showPercentStack}
                        />
                    )}
                </Card.Section>
            </Card>
            <Card withBorder shadow="lg" p="lg" mb="sm">
                <Card.Section withBorder p={0}>
                    <Group justify="space-between" p="xs">
                        <Text size="sm">Duration of our Test Runs</Text>
                    </Group>
                </Card.Section>
                <Card.Section pt={'xs'} pr={'xs'} ml={-10} pb="xs">
                    {toLoad ? (
                        <Skeleton w={'100%'} h={150} animate />
                    ) : (
                        <AreaWithTestRunDuration
                            runs={properties.runs.map((run) => ({
                                duration: run.Duration.asSeconds(),
                                id: run.Id,
                            }))}
                        />
                    )}
                </Card.Section>
            </Card>
        </Stack>
    );
}
