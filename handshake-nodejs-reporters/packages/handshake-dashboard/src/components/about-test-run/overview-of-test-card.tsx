import type { TextProps } from '@mantine/core';
import {
    Badge,
    Card,
    Group,
    rem,
    ActionIcon,
    Select,
    Skeleton,
    Text,
    Tooltip,
    Grid,
    Anchor,
    Box,
    Paper,
    Stack,
    ScrollAreaAutosize,
    SimpleGrid,
    ThemeIcon,
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
    jsonFeedForOverviewOfTestRun,
    jsonFeedForProjects,
    testRunPage,
} from 'components/links';
import type { Projects } from 'types/test-run-records';
import type { DetailedTestRecord } from 'types/parsed-records';
import { FrameworksUsed } from './framework-icons';
import { OnPlatform } from './platform-icon';
import type { OverviewOfEntities } from 'extractors/transform-run-record';
import PlatformEntity, {
    DetailedPlatformVersions,
} from 'components/about-test-entities/platform-entity';
import { useDisclosure } from '@mantine/hooks';
import TestStatusRing from './test-status-ring';
import TestStatusIcon, { standingToColors } from './test-status';
import { captialize } from 'components/meta-text';

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

function getChange(
    values: number[],
    isRecentRun: boolean,
    referFrom?: number,
): number {
    const referPrevious = referFrom !== undefined && isRecentRun;
    return (
        (values?.at(referPrevious ? -1 : (referFrom as number)) ?? 0) -
        (values.at(referPrevious ? -2 : -1) ?? 0)
    );
}

const comparingToRecentRunLabel = 'Compared to the Recent Test Run';
const forRecentTestRunLabel = 'Compared to the Last Test Run';

export function NotedValues(properties: {
    testRunRecord?: DetailedTestRecord;
    rawForceFeedPlatforms?: OverviewOfEntities['platforms'];
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

    const [opened, { open, close }] = useDisclosure();
    const platforms = properties.rawForceFeedPlatforms ?? rawFeed?.platforms;
    const testColor = standingToColors(run?.Status ?? 'PENDING', true);

    const data = [
        {
            value: <OnPlatform platform={run?.Platform ?? ''} size="sm" />,
            title: 'OS',
            description: `Ran on ${run?.Platform}`,
        },
        {
            value: <TestStatusIcon status={run?.Status ?? 'PENDING'} />,
            title: 'Exit Code',
            description: `Current Test Run Status: ${captialize(run?.RunStatus ?? '')}`,
        },
        {
            value: platforms ? (
                <>
                    <ActionIcon
                        onClick={() => open()}
                        color="gray"
                        variant="light"
                        w={20 + 10 * platforms.length}
                    >
                        <PlatformEntity
                            entityNames={platforms.map(
                                (entity) => entity.entityName,
                            )}
                            size="sm"
                        />
                    </ActionIcon>
                    <DetailedPlatformVersions
                        records={platforms}
                        opened={opened}
                        onClose={close}
                        title={'Ran on Platforms:'}
                    />
                </>
            ) : (
                false
            ),
            title: 'Platform',
            description: 'Ran on Platforms (Browsers/Console)',
            skipThemeIcon: true,
        },
        {
            value: <Text>{run?.MaxInstances ?? 0}</Text>,
            title: 'Max. Instances',
            description:
                'Maximum Parallel Instances used inside the Test Framework',
        },
        {
            value: <Text>{rawFeed?.aggregated?.files ?? 0}</Text>,
            title: 'Files',
            description: 'Total Number of Test files',
        },
        {
            value: <Text>{run?.Bail ?? 0}</Text>,
            title: 'Bail',
            description: 'Bail After x failures in the test run',
        },
        {
            value: (
                <FrameworksUsed frameworks={run?.Frameworks ?? []} size="md" />
            ),
            title: 'Framework',
            description: 'Test Framework',
            skipThemeIcon: true,
        },
        {
            value: <Text>{rawFeed?.aggregated?.sessions ?? 0}</Text>,
            title: 'Sessions',
            description: 'Number of Test sessions',
        },
    ];

    const items = data
        .filter((item) => item.value)
        .map((item) => (
            <div key={item.title}>
                {item.skipThemeIcon ? (
                    item.value
                ) : (
                    <ThemeIcon
                        variant="light"
                        size={40}
                        radius={40}
                        color={testColor}
                    >
                        {item.value}
                    </ThemeIcon>
                )}
                <Text mt="sm" mb={7} pl={6}>
                    {item.title}
                </Text>
                <Text size="sm" c="dimmed" lh={1.6} pl={12}>
                    {item.description}
                </Text>
            </div>
        ));

    return (
        <Paper py={15}>
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md" px="md">
                {items}
            </SimpleGrid>
        </Paper>
    );
}

export default function OverviewCard(properties: {
    run?: DetailedTestRecord;
    mockData?: Projects;
}): ReactNode {
    const {
        data: _projects,
        isLoading: loadingProjects,
        error: fetchProjectsError,
    } = useSWRImmutable<Projects>(
        properties.mockData ? undefined : jsonFeedForProjects(),
        () =>
            fetch(jsonFeedForProjects()).then(async (response) =>
                response.json(),
            ),
    );
    const projects = properties.mockData ?? _projects;

    const run = properties.run;
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
    const toLoad =
        run === undefined ||
        loadingProjects ||
        fetchProjectsError !== undefined;

    const totalEntity = (showTests ? run?.Tests : run?.Suites) as number;
    const rateValues = (showTests ? run?.Rate : run?.SuitesSummary) as number[];

    const isRecentRun = run?.projectIndex === 0;
    const relativeIndex =
        run?.projectIndex === undefined ? undefined : -(run.projectIndex + 1);

    const previousProject =
        relativeIndex && relativeIndex < 0 && ids.at(relativeIndex - 1);
    const nextProject =
        !isRecentRun && relativeIndex && ids.at(relativeIndex + 1);

    const improvedCount =
        (rateValues && getChange(testCounts, isRecentRun, relativeIndex)) ??
        '--';
    const improvedDuration =
        durations && getChange(durations, isRecentRun, relativeIndex);

    const improvedPassedCount =
        passedCounts && getChange(passedCounts, isRecentRun, relativeIndex);
    const improvedFailedCount =
        failedCounts && getChange(failedCounts, isRecentRun, relativeIndex);
    return (
        <ScrollAreaAutosize
            h={'calc(100vh - var(--app-shell-header-height, 0px))'}
            pt="md"
            pb="sm"
            pl="sm"
            scrollbars="y"
        >
            <Card p="sm" withBorder shadow="lg" radius="lg">
                <Card.Section
                    withBorder
                    p="sm"
                    px="md"
                    style={{ height: rem(53) }}
                >
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Group align="baseline" wrap="nowrap">
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
                        <Group align="center" wrap="nowrap">
                            {run?.RunStatus === 'COMPLETED' ? (
                                <></>
                            ) : (
                                <Badge
                                    color={
                                        run?.RunStatus === 'INTERNAL_ERROR'
                                            ? 'red.9'
                                            : 'orange.9'
                                    }
                                    variant="light"
                                    title={run?.RunStatus}
                                >
                                    {run?.RunStatus?.replaceAll('_', ' ')}
                                </Badge>
                            )}
                            {toLoad ? (
                                <Skeleton animate width={100} height={18} />
                            ) : (
                                <Badge
                                    color="orange.8"
                                    variant="light"
                                    tt="none"
                                >
                                    <TimeRange
                                        startTime={run?.Started as Dayjs}
                                        endTime={run?.Ended as Dayjs}
                                        size="xs"
                                    />
                                </Badge>
                            )}
                            <Group wrap="nowrap">
                                <Tooltip label="Previous Test Run" color="teal">
                                    <Anchor
                                        href={testRunPage(
                                            previousProject || '',
                                        )}
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
                                    <Anchor
                                        href={testRunPage(nextProject || '')}
                                    >
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            disabled={!nextProject}
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

                <Stack>
                    <Card.Section p="sm">
                        <Grid columns={2}>
                            <Grid.Col span={0.8} pl={12} pt={rem('5%')}>
                                <Card.Section>
                                    <TestStatusRing
                                        labelText={
                                            showTests ? 'Tests' : 'Suites'
                                        }
                                        rateValues={rateValues}
                                        totalEntity={totalEntity}
                                        onHovered={setHovered}
                                        toLoad={toLoad}
                                    />
                                </Card.Section>
                            </Grid.Col>
                            <Grid.Col span={1.1} pt={rem('5%')} pl={3}>
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

                    <Card.Section
                        mt={passedCounts.length > 1 ? -15 : -25}
                        withBorder
                        p="md"
                    >
                        <NotedValues testRunRecord={run} />
                    </Card.Section>
                </Stack>
            </Card>
        </ScrollAreaAutosize>
    );
}
