import type { TextProps } from '@mantine/core';
import {
    Badge,
    Card,
    Group,
    rem,
    RingProgress,
    ActionIcon,
    Select,
    Skeleton,
    Text,
    Tooltip,
    Grid,
    Table,
    ScrollArea,
    Anchor,
    Box,
    Paper,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import type { ReactNode } from 'react';
import React, { useMemo, useState } from 'react';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import CountUpNumber from 'components/counter';
import { Sparkline } from '@mantine/charts';
import {
    durationText,
    HumanizedDuration,
} from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';
import useSWRImmutable from 'swr/immutable';
import {
    jsonFeedAboutTestRun,
    jsonFeedForOverviewOfTestRun,
    jsonFeedForProjects,
    testRunPage,
} from 'components/links';
import type { Projects, TestRunRecord } from 'types/test-run-records';
import type { OverviewOfEntities } from 'extractors/transform-run-record';
import transformTestRunRecord from 'extractors/transform-run-record';
import { FrameworksUsed } from './framework-icons';
import type { DetailedTestRecord } from 'types/parsed-records';
import { OnPlatform } from './platform-icon';
dayjs.extend(duration);

function colorFromChange(change: number, reverse?: boolean): TextProps['c'] {
    if (change === 0) return 'gray';
    const colors = ['red', 'green'];
    const colorIndex = Number(change > 0) ^ Number(reverse); // XOR operation
    return colors[colorIndex];
}
function indicateNumber(change: number, forceText?: string): string | number {
    if (change === 0) return change;
    return `${change > 0 ? '+' : ''}${forceText ?? change}`;
}

function getChange(values: number[], referFrom?: number): number {
    return (
        (values?.at(referFrom === undefined ? -1 : referFrom) ?? 0) -
        (values.at(referFrom === undefined ? -2 : -1) ?? 0)
    );
}

const comparingToRecentRunLabel = 'Compared to the Recent Test Run';
const forRecentTestRunLabel = 'Compared to the Last Test Run';

function NotedValues(properties: {
    testRunRecord?: DetailedTestRecord;
}): ReactNode {
    const run = properties.testRunRecord;
    const {
        data: rawFeed,
        // isLoading: overviewFeed,
        // error,
    } = useSWRImmutable<OverviewOfEntities>(
        run?.Id ? jsonFeedForOverviewOfTestRun(run.Id) : undefined,
        () =>
            fetch(jsonFeedForOverviewOfTestRun(run?.Id as string)).then(
                async (response) => response.json(),
            ),
    );

    return (
        <Paper>
            <ScrollArea h={190}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Config. Name</Table.Th>
                            <Table.Th>Config. Value</Table.Th>
                            <Table.Th>Configured / Observed</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Td>Platform</Table.Td>
                            <Table.Td>
                                <OnPlatform
                                    platform={run?.Platform ?? ''}
                                    size="sm"
                                />
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Configured
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>ExitCode</Table.Td>
                            <Table.Td>
                                <Text c={run?.ExitCode === 0 ? 'green' : 'red'}>
                                    {run?.ExitCode ?? 0}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Observed
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>Max. Instances</Table.Td>
                            <Table.Td>
                                <Text>{run?.MaxInstances ?? 0}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Configured
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>Files</Table.Td>
                            <Table.Td>
                                <Text>{rawFeed?.aggregated?.files ?? 0}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Observed
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>Bail</Table.Td>
                            <Table.Td>
                                <Text>{run?.Bail ?? 0}</Text>
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Configured
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>Sessions</Table.Td>
                            <Table.Td>
                                <Text>
                                    {rawFeed?.aggregated?.sessions ?? 0}
                                </Text>
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Observed
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td>Frameworks</Table.Td>
                            <Table.Td>
                                <FrameworksUsed
                                    frameworks={run?.Frameworks ?? []}
                                    size="sm"
                                />
                            </Table.Td>
                            <Table.Td>
                                <Text c="dimmed" size="sm">
                                    Configured
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Paper>
    );
}

export default function OverviewCard(properties: {
    testID?: string;
}): ReactNode {
    const {
        data: rawRun,
        isLoading,
        error,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );

    const {
        data: projects,
        isLoading: loadingProjects,
        error: fetchProjectsError,
    } = useSWRImmutable<Projects>(jsonFeedForProjects(), () =>
        fetch(jsonFeedForProjects()).then(async (response) => response.json()),
    );

    const run = useMemo(
        () => rawRun && transformTestRunRecord(rawRun),
        [rawRun],
    );

    const [showTests, setShowTests] = useState(false);

    const [passedCounts, failedCounts, testCounts, durations, ids] =
        useMemo(() => {
            const required = projects && projects[run?.projectName ?? ''];
            return required
                ? [
                      required.map((project) =>
                          showTests ? project.passed : project.passedSuites,
                      ),
                      required.map((project) =>
                          showTests ? project.failed : project.failedSuites,
                      ),
                      required.map((project) =>
                          showTests ? project.tests : project.suites,
                      ),
                      required.map((project) => project.duration),
                      required.map((project) => project.testID),
                  ]
                : [[], [], [], [], []];
        }, [projects, run, showTests]);

    const [hovered, setHovered] = useState<undefined | number>();
    const reset = () => setHovered(undefined);

    const toLoad =
        isLoading ||
        loadingProjects ||
        !properties.testID ||
        error !== undefined ||
        fetchProjectsError !== undefined;
    run === undefined || projects === undefined;

    const colors = ['green', 'red', 'yellow'];
    const tips = ['Passed', 'Failed', 'Skipped'];

    const totalEntity = (showTests ? run?.Tests : run?.Suites) as number;
    const rateValues = (showTests ? run?.Rate : run?.SuitesSummary) as number[];

    const isRecentRun = run?.projectIndex === 0;
    const relativeIndex = run?.projectIndex
        ? -(run.projectIndex + 1)
        : undefined;

    const fromFrontIndex =
        run?.projectIndex !== undefined && ids.length - run?.projectIndex - 1;
    const previousProject = fromFrontIndex !== false && ids[fromFrontIndex - 1];
    const nextProject = fromFrontIndex !== false && ids[fromFrontIndex + 1];

    const improvedCount =
        (rateValues && getChange(testCounts, relativeIndex)) ?? '--';
    const improvedDuration = durations && getChange(durations, relativeIndex);

    const improvedPassedCount =
        passedCounts && getChange(passedCounts, relativeIndex);
    const improvedFailedCount =
        failedCounts && getChange(failedCounts, relativeIndex);
    return (
        <Card p="sm" withBorder shadow="lg" radius="lg">
            <Card.Section withBorder p="sm" px="md">
                <Group justify="space-between" align="baseline">
                    <Group align="baseline">
                        <Text mr={-6}>Executed</Text>
                        {toLoad ? (
                            <Skeleton animate width={25} height={12} />
                        ) : (
                            <CountUpNumber
                                endNumber={totalEntity}
                                maxDigitsOf={run?.Tests ?? 1}
                                style={{
                                    fontSize: rem(20),
                                    fontWeight: 'bold',
                                }}
                            />
                        )}
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
                        {toLoad ? (
                            <Skeleton animate width={110} height={15} />
                        ) : (
                            <HumanizedDuration
                                duration={run?.Duration as Duration}
                                prefix="for "
                            />
                        )}
                    </Group>
                    <Group align="center">
                        {isRecentRun ? (
                            <Badge
                                color="blue.9"
                                variant="light"
                                title={
                                    run.timelineIndex === 0
                                        ? 'Recent Test Run'
                                        : `Recent Test Run of ${run.projectName}`
                                }
                            >
                                Recent Run
                            </Badge>
                        ) : (
                            <></>
                        )}

                        {toLoad ? (
                            <Skeleton animate width={100} height={18} />
                        ) : (
                            <Badge color="orange.8" variant="light" tt="none">
                                <TimeRange
                                    startTime={run?.Started as Dayjs}
                                    endTime={run?.Ended as Dayjs}
                                    size="xs"
                                />
                            </Badge>
                        )}
                        <Group>
                            <Tooltip label="Previous Test Run" color="teal">
                                <Anchor
                                    href={testRunPage(previousProject || '')}
                                >
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        disabled={!previousProject}
                                        mr={0}
                                        radius={'sm'}
                                    >
                                        <IconChevronLeft
                                            style={{
                                                width: rem(16),
                                                height: rem(16),
                                            }}
                                            stroke={1.5}
                                        />
                                    </ActionIcon>
                                </Anchor>
                            </Tooltip>
                            <Tooltip label="Next Test Run" color="teal">
                                <Anchor href={testRunPage(nextProject || '')}>
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        disabled={!nextProject}
                                        c={nextProject ? undefined : 'gray'}
                                        radius={'sm'}
                                        ml={0}
                                    >
                                        <IconChevronRight
                                            style={{
                                                width: rem(16),
                                                height: rem(16),
                                            }}
                                            stroke={1.5}
                                        />
                                    </ActionIcon>
                                </Anchor>
                            </Tooltip>
                        </Group>
                    </Group>
                </Group>
            </Card.Section>
            {/* body from here */}
            {/* https://uigradients.com/#RedOcean */}
            <Card.Section
                p="sm"
                style={{
                    background:
                        'linear-gradient(to left, #2c3e50,#1D4350); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */',
                }}
            >
                <Grid columns={2}>
                    <Grid.Col span={0.8}>
                        <Card.Section>
                            {toLoad ? (
                                <Skeleton circle height={205} animate m="lg" />
                            ) : (
                                <RingProgress
                                    size={250}
                                    label={
                                        <Text
                                            size="sm"
                                            ta="center"
                                            px="xs"
                                            style={{ pointerEvents: 'none' }}
                                            c={colors[hovered ?? 0]}
                                        >
                                            <b>{`${Number(((rateValues[hovered ?? 0] / totalEntity) * 1e2).toFixed(2))}% `}</b>
                                            <sub>
                                                [{rateValues[hovered ?? 0]}]
                                            </sub>
                                            {` of ${showTests ? 'Tests' : 'Suites'} have ${tips[hovered ?? 0]}.`}
                                        </Text>
                                    }
                                    thickness={25}
                                    onMouseLeave={() => setHovered(undefined)}
                                    sections={rateValues.map(
                                        (value, index) => ({
                                            value: (value / totalEntity) * 100,
                                            color: colors[index],
                                            tooltip: tips[index],
                                            onMouseEnter: () =>
                                                setHovered(index),
                                            onMouseLeave: reset,
                                            style: {
                                                cursor: 'pointer',
                                            },
                                        }),
                                    )}
                                />
                            )}
                        </Card.Section>
                    </Grid.Col>
                    <Grid.Col span={1.1}>
                        <Card.Section>
                            <Grid columns={2} title="Trend">
                                <Grid.Col span={1}>
                                    <Box p="xs">
                                        <Card.Section withBorder p="xs">
                                            <Group justify="space-between">
                                                <Text
                                                    size="xs"
                                                    fw={
                                                        hovered
                                                            ? 500
                                                            : undefined
                                                    }
                                                    td={
                                                        hovered
                                                            ? 'undefined'
                                                            : undefined
                                                    }
                                                >
                                                    {showTests
                                                        ? 'Tests'
                                                        : 'Suites'}{' '}
                                                    Trend
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c={colorFromChange(
                                                        improvedCount,
                                                    )}
                                                >
                                                    {indicateNumber(
                                                        improvedCount,
                                                    )}
                                                </Text>
                                            </Group>
                                        </Card.Section>
                                        {toLoad ? (
                                            <Skeleton h={70} w={150} />
                                        ) : (
                                            <Sparkline
                                                data={testCounts}
                                                w={150}
                                                trendColors={{
                                                    positive: 'green.6',
                                                    negative: 'red.6',
                                                    neutral: 'gray.5',
                                                }}
                                                h={70}
                                            />
                                        )}
                                    </Box>
                                </Grid.Col>
                                <Grid.Col span={1}>
                                    <Box p="xs">
                                        <Card.Section withBorder p="xs">
                                            <Group justify="space-between">
                                                <Text size="xs">
                                                    Duration Trend
                                                </Text>
                                                <Tooltip
                                                    label={
                                                        isRecentRun
                                                            ? forRecentTestRunLabel
                                                            : comparingToRecentRunLabel
                                                    }
                                                >
                                                    <Tooltip
                                                        label={
                                                            isRecentRun
                                                                ? forRecentTestRunLabel
                                                                : comparingToRecentRunLabel
                                                        }
                                                    >
                                                        <Text
                                                            size="xs"
                                                            c={colorFromChange(
                                                                improvedDuration,
                                                                true,
                                                            )}
                                                        >
                                                            {indicateNumber(
                                                                improvedDuration,
                                                                durationText(
                                                                    Number(
                                                                        (
                                                                            improvedDuration /
                                                                            1e3
                                                                        ).toFixed(
                                                                            2,
                                                                        ),
                                                                    ),
                                                                ),
                                                            )}
                                                        </Text>
                                                    </Tooltip>
                                                </Tooltip>
                                            </Group>
                                        </Card.Section>
                                        {toLoad ? (
                                            <Skeleton h={70} w={150} />
                                        ) : (
                                            <Sparkline
                                                data={durations}
                                                w={150}
                                                trendColors={{
                                                    negative: 'green.6',
                                                    positive: 'red.6',
                                                    neutral: 'gray.5',
                                                }}
                                                h={70}
                                            />
                                        )}
                                    </Box>
                                </Grid.Col>
                                <Grid.Col span={1}>
                                    <Box p="xs">
                                        <Card.Section withBorder p="xs">
                                            <Group justify="space-between">
                                                <Text
                                                    size="xs"
                                                    fw={
                                                        hovered === 0
                                                            ? 500
                                                            : undefined
                                                    }
                                                    td={
                                                        hovered === 0
                                                            ? 'undefined'
                                                            : undefined
                                                    }
                                                >
                                                    Passed Trend
                                                </Text>
                                                <Tooltip
                                                    label={
                                                        isRecentRun
                                                            ? forRecentTestRunLabel
                                                            : comparingToRecentRunLabel
                                                    }
                                                >
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
                                                </Tooltip>
                                            </Group>
                                        </Card.Section>
                                        {toLoad ? (
                                            <Skeleton h={70} w={150} />
                                        ) : (
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
                                        )}
                                    </Box>
                                </Grid.Col>
                                <Grid.Col span={1}>
                                    <Box p="xs">
                                        <Card.Section withBorder p="xs">
                                            <Group justify="space-between">
                                                <Text
                                                    size="xs"
                                                    fw={
                                                        hovered === 2
                                                            ? 500
                                                            : undefined
                                                    }
                                                    td={
                                                        hovered === 2
                                                            ? 'undefined'
                                                            : undefined
                                                    }
                                                >
                                                    Failed Trend
                                                </Text>
                                                <Tooltip
                                                    label={
                                                        isRecentRun
                                                            ? forRecentTestRunLabel
                                                            : comparingToRecentRunLabel
                                                    }
                                                >
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
                                                </Tooltip>
                                            </Group>
                                        </Card.Section>
                                        {toLoad ? (
                                            <Skeleton h={70} w={150} />
                                        ) : (
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
                                        )}
                                    </Box>
                                </Grid.Col>
                            </Grid>
                        </Card.Section>
                    </Grid.Col>
                </Grid>
            </Card.Section>

            <Card.Section withBorder p="md">
                <NotedValues testRunRecord={run} />
            </Card.Section>
        </Card>
    );
}
