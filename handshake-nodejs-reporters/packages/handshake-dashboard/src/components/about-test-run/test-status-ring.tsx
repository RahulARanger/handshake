import type { TextProps } from '@mantine/core';
import {
    Badge,
    Card,
    Group,
    rem,
    RingProgress,
    Select,
    Stack,
    Text,
} from '@mantine/core';
import type { Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import CountUpNumber from 'components/counter';
import { Sparkline } from '@mantine/charts';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';

dayjs.extend(duration);

function colorFromChange(change: number, reverse?: boolean): TextProps['c'] {
    if (change === 0) return 'gray';
    const colors = ['red', 'green'];
    const colorIndex = Number(change > 0) ^ Number(reverse); // XOR operation
    return colors[colorIndex];
}
function indicateNumber(change: number): string | number {
    if (change === 0) return change;
    return `${change > 0 ? '+' : ''}${change}`;
}

function getChange(values: number[]): number {
    return (values?.at(-1) ?? 0) - (values.at(-2) ?? 0);
}

export default function OverviewCard(properties: {
    rate: [number, number, number];
    at: Dayjs;
    suites: [number, number, number];
    totalTests: number;
    totalSuites: number;
    duration: Duration;
    testCounts: number[];
    durations: number[];
    startTime: Dayjs;
    endTime: Dayjs;
    passedCountsForTests: number[];
    failedCountsForTests: number[];
    passedCountForSuites: number[];
    failedCountsForSuites: number[];
}): ReactNode {
    const [hovered, setHovered] = useState<undefined | number>();
    const [showTests, setShowTests] = useState(false);
    const reset = () => setHovered(undefined);
    const colors = ['green', 'yellow', 'red'];
    const tips = ['Passed', 'Skipped', 'Failed'];

    const totalEntity = showTests
        ? properties.totalTests
        : properties.totalSuites;
    const rateValues = showTests ? properties.rate : properties.suites;
    const passedCounts = showTests
        ? properties.passedCountsForTests
        : properties.passedCountForSuites;
    const failedCounts = showTests
        ? properties.failedCountsForTests
        : properties.failedCountsForSuites;

    const improvedCount = getChange(rateValues);
    const improvedDuration = getChange(properties.durations);

    const improvedPassedCount = getChange(passedCounts);
    const improvedFailedCount = getChange(failedCounts);

    return (
        <Card p="sm" withBorder shadow="lg" radius="lg">
            <Card.Section withBorder p="sm" px="md">
                <Group justify="space-between">
                    <Group align="baseline">
                        <Text mr={-6}>Executed</Text>
                        <CountUpNumber
                            endNumber={totalEntity}
                            maxDigits={properties.totalTests}
                            style={{ fontSize: rem(14) }}
                        />
                        <Select
                            clearable={false}
                            unselectable="off"
                            allowDeselect={false}
                            value={String(showTests)}
                            variant="unstyled"
                            w={73}
                            ml={-6}
                            mr={-18}
                            comboboxProps={{ width: rem(85) }}
                            withCheckIcon={false}
                            data={[
                                { value: 'true', label: 'Tests' },
                                { value: 'false', label: 'Suites' },
                            ]}
                            onChange={(_) => setShowTests(_ === 'true')}
                        />
                        <HumanizedDuration
                            duration={properties.duration}
                            prefix="for "
                        />
                    </Group>
                    <Group align="baseline">
                        <Badge color="blue.9" variant="light">
                            Recent Run
                        </Badge>
                        <Badge color="red.8" variant="light">
                            Bailed
                        </Badge>
                        <Badge color="orange.8" variant="light" tt="none">
                            <TimeRange
                                startTime={properties.startTime}
                                endTime={properties.endTime}
                                size="xs"
                            />
                        </Badge>
                    </Group>
                </Group>
            </Card.Section>
            <Group align="center" justify="center">
                <Card.Section p="sm">
                    <RingProgress
                        size={250}
                        mb={-30}
                        label={
                            <Text
                                size="sm"
                                ta="center"
                                px="xs"
                                style={{ pointerEvents: 'none' }}
                                c={colors[hovered ?? 0]}
                            >
                                {`${Number(((rateValues[hovered ?? 0] / totalEntity) * 1e2).toFixed(2))}% `}
                                <sub>[{rateValues[hovered ?? 0]}]</sub>
                                {` of Tests have ${tips[hovered ?? 0]}.`}
                            </Text>
                        }
                        thickness={25}
                        onMouseLeave={() => setHovered(undefined)}
                        sections={rateValues.map((value, index) => ({
                            value: (value / totalEntity) * 100,
                            color: colors[index],
                            tooltip: tips[index],
                            onMouseEnter: () => setHovered(index),
                            onMouseLeave: reset,
                            style: { cursor: 'pointer' },
                            // showTests && index === 2
                            //     ? { cursor: 'pointer' }
                            //     : undefined,
                        }))}
                    />
                </Card.Section>
                <Card.Section p="sm">
                    <Stack>
                        <Group>
                            <Card p="xs" shadow={hovered === 0 ? 'xl' : 'xs'}>
                                <Card.Section withBorder p="xs">
                                    <Group justify="space-between">
                                        <Text
                                            size="xs"
                                            fw={hovered ? 500 : undefined}
                                            td={
                                                hovered
                                                    ? 'undefined'
                                                    : undefined
                                            }
                                        >
                                            {showTests ? 'Tests' : 'Suites'}
                                        </Text>
                                        <Text
                                            size="xs"
                                            c={colorFromChange(improvedCount)}
                                        >
                                            {indicateNumber(improvedCount)}
                                        </Text>
                                    </Group>
                                </Card.Section>
                                <Sparkline
                                    data={properties.testCounts}
                                    w={150}
                                    trendColors={{
                                        positive: 'green.6',
                                        negative: 'red.6',
                                        neutral: 'gray.5',
                                    }}
                                    h={70}
                                />
                            </Card>
                            <Card p="xs">
                                <Card.Section withBorder p="xs">
                                    <Group justify="space-between">
                                        <Text size="xs">Duration</Text>
                                        <Text
                                            size="xs"
                                            c={colorFromChange(
                                                improvedDuration,
                                                true,
                                            )}
                                        >
                                            {indicateNumber(improvedDuration)}s
                                        </Text>
                                    </Group>
                                </Card.Section>
                                <Sparkline
                                    data={properties.durations}
                                    w={150}
                                    trendColors={{
                                        negative: 'green.6',
                                        positive: 'red.6',
                                        neutral: 'gray.5',
                                    }}
                                    h={70}
                                />
                            </Card>
                        </Group>
                        <Group>
                            <Card p="xs" shadow={hovered === 0 ? 'xl' : 'xs'}>
                                <Card.Section withBorder p="xs">
                                    <Group justify="space-between">
                                        <Text
                                            size="xs"
                                            fw={hovered === 0 ? 500 : undefined}
                                            td={
                                                hovered === 0
                                                    ? 'undefined'
                                                    : undefined
                                            }
                                        >
                                            Passed
                                        </Text>
                                        <Text
                                            size="xs"
                                            c={colorFromChange(
                                                improvedPassedCount,
                                            )}
                                        >
                                            {indicateNumber(
                                                improvedPassedCount,
                                            )}
                                        </Text>
                                    </Group>
                                </Card.Section>
                                <Sparkline
                                    data={passedCounts}
                                    w={150}
                                    trendColors={{
                                        positive: 'green.6',
                                        negative: 'red.6',
                                        neutral: 'gray.5',
                                    }}
                                    h={70}
                                />
                            </Card>
                            <Card p="xs" shadow={hovered === 2 ? 'xl' : 'xs'}>
                                <Card.Section withBorder p="xs">
                                    <Group justify="space-between">
                                        <Text
                                            size="xs"
                                            fw={hovered === 2 ? 500 : undefined}
                                            td={
                                                hovered === 2
                                                    ? 'undefined'
                                                    : undefined
                                            }
                                        >
                                            Failed
                                        </Text>
                                        <Text
                                            size="xs"
                                            c={colorFromChange(
                                                improvedFailedCount,
                                                true,
                                            )}
                                        >
                                            {indicateNumber(
                                                improvedFailedCount,
                                            )}
                                        </Text>
                                    </Group>
                                </Card.Section>
                                <Sparkline
                                    data={failedCounts}
                                    w={150}
                                    trendColors={{
                                        negative: 'green.6',
                                        positive: 'red.6',
                                        neutral: 'gray.5',
                                    }}
                                    h={70}
                                />
                            </Card>
                        </Group>
                    </Stack>
                </Card.Section>
            </Group>
        </Card>
    );
}
