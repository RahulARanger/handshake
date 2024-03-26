import type { ScrollAreaAutosizeProps } from '@mantine/core';
import {
    Card,
    Stack,
    rem,
    Group,
    ScrollAreaAutosize,
    Switch,
    Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { DetailedTestRecord } from 'types/parsed-records';
import AreaChartForTestRuns from './area-test-runs';
import SwitchTestCases from 'components/test-case-switch';
import AreaWithTestRunDuration from './test-runs-duration';

export default function TestRunsChartArea(properties: {
    runs: DetailedTestRecord[];
    h: ScrollAreaAutosizeProps['h'];
    chartWidth?: string;
}): ReactNode {
    const [switchOption, setSwitchOption] = useState<{
        showTests: boolean;
        showPercentStack: boolean;
    }>({ showTests: false, showPercentStack: false });
    return (
        <ScrollAreaAutosize h={properties.h} px="sm" pb={'lg'}>
            <Stack pr="xs">
                <Card p="lg" radius="lg" shadow="lg" withBorder>
                    <Card.Section withBorder>
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
                    <Card.Section p="sm">
                        <AreaChartForTestRuns
                            Rates={properties.runs.map((run) => ({
                                rate: switchOption.showTests
                                    ? run.Rate
                                    : run.SuitesSummary,
                                date: run.Started,
                            }))}
                            w={properties.chartWidth ?? '60vw'}
                            percentStack={switchOption.showPercentStack}
                        />
                    </Card.Section>
                </Card>
                <Card withBorder shadow="lg" radius="lg" p="lg">
                    <Card.Section withBorder>
                        <Group justify="space-between" p="xs">
                            <Text size="sm">Duration of our Test Runs</Text>
                        </Group>
                    </Card.Section>
                    <Card.Section p="sm">
                        <AreaWithTestRunDuration
                            durations={properties.runs.map((run) =>
                                run.Duration.asSeconds(),
                            )}
                        />
                    </Card.Section>
                </Card>
            </Stack>
        </ScrollAreaAutosize>
    );
}
