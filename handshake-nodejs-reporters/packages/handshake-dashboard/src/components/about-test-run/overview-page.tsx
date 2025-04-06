import type { DefaultMantineColor } from '@mantine/core';
import {
    Badge,
    Group,
    rem,
    ActionIcon,
    Select,
    Skeleton,
    Text,
    Tooltip,
    Anchor,
    Paper,
    Stack,
    Center,
    Divider,
    SegmentedControl,
} from '@mantine/core';
import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconChevronLeft,
    IconChevronRight,
} from '@tabler/icons-react';
import type { Dayjs } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import React, { useMemo, useRef, useState } from 'react';
import CountUpNumber from 'components/counter';
import {
    AreaChart,
    getFilteredChartTooltipPayload,
    PieChart,
} from '@mantine/charts';
import Confetti from 'react-confetti-boom';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import { TimeRange } from 'components/timings/time-range';
import useSWRImmutable from 'swr/immutable';
import { jsonFeedForProjects, testRunPage } from 'components/links';
import type { Projects } from 'types/test-run-records';
import type { DetailedTestRecord } from 'types/parsed-records';
import { useInterval } from '@mantine/hooks';
import { standingToColors } from './test-status';
import { captialize, getRandomInt } from 'components/meta-text';
import PassedRate from './passed-rate';
import { statusOfEntity } from 'types/session-records';
import { Payload } from 'recharts/types/component/DefaultTooltipContent';

const gen = () => [
    { name: 'P', value: getRandomInt(0, 10), color: 'orange' },
    { name: 'S', value: getRandomInt(0, 10), color: 'green' },
    { name: 'A', value: getRandomInt(0, 10), color: 'red' },
    { name: 'D', value: getRandomInt(0, 10), color: 'blue' },
];

export function LoadingPie() {
    const [mockData, setMockData] = useState(gen());
    useInterval(
        () => {
            setMockData(() => gen());
        },
        3000,
        { autoInvoke: true },
    );

    return (
        <Center p="xl" m="xl">
            <Stack align="center">
                <PieChart
                    size={160}
                    data={mockData}
                    title="Loading..."
                    withTooltip={false}
                    pieProps={{ isAnimationActive: true }}
                />
                <Text>Loading...</Text>
            </Stack>
        </Center>
    );
}

function PieViewOfStatus(properties: {
    rate: [number, number, number, number, number];
    text: string;
}) {
    const rate = properties.rate;
    const data = useMemo(() => {
        return ['PASSED', 'FAILED', 'SKIPPED', 'XFAILED', 'XPASSED'].map(
            (status, index) => ({
                name: captialize(status),
                value: rate[index],
                color: standingToColors(
                    status as statusOfEntity,
                ) as DefaultMantineColor,
            }),
        );
    }, [rate]);

    return (
        <Paper>
            <Stack align="center">
                <PieChart
                    size={250}
                    withLabelsLine
                    labelsType="value"
                    paddingAngle={6}
                    withLabels
                    tooltipDataSource="segment"
                    classNames={{ tooltip: 'mirror' }}
                    data={data}
                    withTooltip
                    pieProps={{ isAnimationActive: true }}
                />
            </Stack>
        </Paper>
    );
}
interface ChartTooltipProperties {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Payload<any, any>[] | undefined;
    reference: number;
    unit?: string;
    currentIndex: number;
    invertReference?: boolean;
}
const nth = (d: number) => {
    const last = +String(d).slice(-2);
    if (last > 3 && last < 21) return 'th';
    const remainder = last % 10;
    if (remainder === 1) return 'st';
    if (remainder === 2) return 'nd';
    if (remainder === 3) return 'rd';
    return 'th';
};

const colorForChange = (value: number) => (value === 0 ? 'bright' : 'teal');

function ChartTooltip({
    reference,
    payload,
    invertReference,
    currentIndex,
    unit,
}: ChartTooltipProperties) {
    if (!payload) return;

    const isPostiveChange = (value: number) => value >= 0 === !invertReference;

    return (
        <Paper px="md" py="sm" withBorder shadow="md" radius="md">
            {getFilteredChartTooltipPayload(payload).map((item) => (
                <Stack key={item.name}>
                    <Text size="sm">
                        {item.payload.index + 1}
                        <sup>{nth(item.payload.index + 1)}</sup>
                        &nbsp;&nbsp;
                        {'Test Run'}
                        {item.payload.index === currentIndex ? (
                            <Text
                                component="span"
                                fs="italic"
                                size="xs"
                                c="indigo"
                                pl="xs"
                            >
                                (Current Test Run)
                            </Text>
                        ) : (
                            <></>
                        )}
                    </Text>
                    <Text size="sm">
                        {item.name}:&nbsp;&nbsp;
                        <Text
                            c={
                                isPostiveChange(item.value)
                                    ? colorForChange(item.value)
                                    : 'red'
                            }
                            fz="sm"
                            fw={500}
                            component="span"
                        >
                            <span>
                                {item.value}
                                {unit ?? ''}
                            </span>
                            {item.value >= 0 ? (
                                <IconArrowUpRight size={16} stroke={1.5} />
                            ) : (
                                <IconArrowDownRight size={16} stroke={1.5} />
                            )}
                        </Text>
                        &nbsp;&nbsp;({item.value + reference}
                        {unit ?? ''})
                    </Text>
                </Stack>
            ))}
        </Paper>
    );
}

function RateOfChangeChart(properties: {
    label: string;
    c: DefaultMantineColor;
    rc?: DefaultMantineColor;
    counts: number[];
    index: number;
    showLineText?: boolean;
    referenceIndex: number;
    unit?: string;
}) {
    return (
        <AreaChart
            h={100}
            data={properties.counts.map((value, index) => ({
                index,
                [properties.label]:
                    value -
                    (properties.counts[properties.referenceIndex ?? 0] ?? 0),
            }))}
            w={385}
            pl="xs"
            pt="xs"
            withYAxis={false}
            dataKey="value"
            tickLine="none"
            gridAxis="none"
            strokeWidth={1}
            unit={`+${properties.counts[properties.referenceIndex ?? 0] ?? 0}`}
            type="split"
            splitColors={[properties.c, properties.rc ?? 'red']}
            areaChartProps={{ syncId: 'rate-of-change-chart' }}
            areaProps={{ isAnimationActive: true }}
            referenceLines={[
                {
                    x: properties.index,
                    label: properties.showLineText ? 'Current Test Run' : '',
                    labelPosition: 'centerBottom',
                },
            ]}
            series={[
                {
                    name: properties.label,
                    color: 'bright',
                },
            ]}
            tooltipProps={{
                content: ({ payload }) => (
                    <ChartTooltip
                        reference={
                            properties.counts[properties.referenceIndex ?? 0]
                        }
                        currentIndex={properties.index}
                        unit={properties.unit ?? ''}
                        payload={payload}
                        invertReference={(properties.rc ?? 'red') !== 'red'}
                    />
                ),
            }}
        />
    );
}

function RateOfChangeCharts(properties: {
    passedCounts: number[];
    failedCounts: number[];
    testCounts: number[];
    durations: number[];
    showTests: boolean;
    index: number;
    referenceIndex: number;
}) {
    return (
        <Stack>
            <RateOfChangeChart
                label="Passed Tests"
                c={standingToColors('PASSED') as DefaultMantineColor}
                counts={properties.passedCounts}
                index={properties.index}
                showLineText
                referenceIndex={properties.referenceIndex}
            />
            <RateOfChangeChart
                label="Failed Tests"
                c={standingToColors('FAILED') as DefaultMantineColor}
                counts={properties.failedCounts}
                index={properties.index}
                rc="green"
                referenceIndex={properties.referenceIndex}
            />
            <RateOfChangeChart
                label="Tests"
                c={'lime'}
                counts={properties.testCounts}
                index={properties.index}
                referenceIndex={properties.referenceIndex}
            />
        </Stack>
    );
}

function OverviewFromRestOfTheProjects(properties: {
    run: DetailedTestRecord;
    mockData?: Projects;
    showTests: boolean;
}) {
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
    const run = properties.run;
    const [rIndex, setRIndex] = useState<number | undefined>();

    const projects = properties.mockData ?? _projects;
    const toLoad = loadingProjects || fetchProjectsError !== undefined;

    const [passedCounts, failedCounts, testCounts, durations, ids, options] =
        useMemo(() => {
            const required =
                projects && projects[run?.projectName ?? ''].toReversed();
            const dOptions = [];
            if (run.projectIndex !== (required ?? []).length - 1)
                dOptions.push('First');
            dOptions.push('Current');
            if (run.projectIndex > 0) dOptions.push('Last');

            return required
                ? [
                      required.map((project) =>
                          properties.showTests
                              ? project.passed
                              : project.passedSuites,
                      ),
                      required.map((project) =>
                          properties.showTests
                              ? project.failed
                              : project.failedSuites,
                      ),
                      required.map((project) =>
                          properties.showTests ? project.tests : project.suites,
                      ),
                      required.map((project) =>
                          Number((project.duration / 1e3).toFixed(2)),
                      ),
                      required.map((project) => project.testID),
                      dOptions,
                  ]
                : [[], [], [], [], [], ['Current']];
        }, [projects, run, properties.showTests]);

    if (toLoad) return <LoadingPie />;

    const relativeIndex = passedCounts.length - (run.projectIndex + 1);
    const previousProject =
        relativeIndex && relativeIndex < 0 && ids.at(relativeIndex - 1);
    const isRecentRun = run?.projectIndex === 0;
    const nextProject =
        !isRecentRun && relativeIndex && ids.at(relativeIndex + 1);

    return (
        <>
            {/* NOTE: using card causes issue with RateOfChangeChart's tooltip's bg */}
            <Paper withBorder maw={450} p="sm">
                <Group wrap="nowrap" align="flex-start">
                    <Text size="sm">
                        Please explore the current test run stats. and its
                        comparsion with rest of the runs.
                    </Text>
                    <Group wrap="nowrap" mt="sm">
                        <Tooltip label="Previous Test Run" color="teal">
                            <Anchor
                                href={testRunPage(previousProject || '')}
                                component="a"
                            >
                                <ActionIcon
                                    size="sm"
                                    variant="outline"
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
                                component="a"
                            >
                                <ActionIcon
                                    size="sm"
                                    variant="outline"
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
                <RateOfChangeChart
                    label="Duration"
                    c={'orange'}
                    rc="green"
                    showLineText
                    index={relativeIndex}
                    counts={durations}
                    referenceIndex={rIndex ?? relativeIndex}
                    unit="s"
                />

                <Group mt="xs" align="center">
                    <Text size="sm">Take reference from: </Text>
                    <SegmentedControl
                        data={options}
                        size="sm"
                        color="orange"
                        defaultValue="Current"
                        onChange={(value) => {
                            if (value === 'Current') setRIndex(relativeIndex);
                            else
                                setRIndex(
                                    value === 'First'
                                        ? 0
                                        : passedCounts.length - 1,
                                );
                        }}
                    />
                    <Text size="sm">Test Run</Text>
                </Group>
                <Text size="sm" mt="xs">
                    {'We are currently at '}
                    {relativeIndex + 1}
                    <sup>{nth(relativeIndex + 1)}</sup>&nbsp;&nbsp;
                    {'Test Run.'}
                </Text>
            </Paper>
            <RateOfChangeCharts
                passedCounts={passedCounts}
                failedCounts={failedCounts}
                showTests={properties.showTests}
                durations={durations}
                testCounts={testCounts}
                index={relativeIndex}
                referenceIndex={rIndex ?? relativeIndex}
            />
        </>
    );
}

export function OverviewBoard(properties: {
    run?: DetailedTestRecord;
    mockData?: Projects;
}) {
    const run = properties.run;
    const [showTests, setShowTests] = useState(false);
    const textReference = useRef<HTMLDivElement>(null);

    const toLoad = run === undefined;
    if (toLoad) {
        return <LoadingPie />;
    }
    const totalEntity = (showTests ? run?.Tests : run?.Suites) as number;

    return (
        <Stack align="center" mb="md">
            {run.Status === 'PASSED' ? (
                <Confetti
                    particleCount={50}
                    mode="fall"
                    colors={['#ff577f', '#ff884b']}
                />
            ) : (
                <></>
            )}
            <Group align="baseline" wrap="nowrap" pl="xs">
                <Badge
                    ref={textReference}
                    variant="light"
                    color={standingToColors(run.Status)}
                >
                    {run.Status}!
                </Badge>
                <Text>Executed</Text>
                <CountUpNumber
                    endNumber={totalEntity}
                    maxDigitsOf={run?.Tests ?? 1}
                    style={{
                        fontSize: rem(20),
                        fontWeight: 'bold',
                    }}
                />
                <Select
                    clearable={false}
                    unselectable="off"
                    allowDeselect={false}
                    value={String(showTests)}
                    variant="unstyled"
                    w={75}
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
                    duration={run?.Duration as Duration}
                    prefix="for "
                />
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

                <Group align="center" wrap="nowrap">
                    {properties.run?.projectIndex === 0 ? (
                        <Badge
                            color="blue.9"
                            variant="light"
                            title={
                                run?.timelineIndex === 0
                                    ? 'Recent Test Run'
                                    : `Recent Test Run of ${run?.projectName}`
                            }
                        >
                            Recent Run
                        </Badge>
                    ) : (
                        <></>
                    )}
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
                </Group>
            </Group>
            {run.Tags ? (
                <Group>
                    {run.Tags.map((tag) => (
                        <Tooltip key={tag.name} label={tag.label} color="cyan">
                            <Badge size="sm" variant="light" color="cyan.9">
                                {tag.name}
                            </Badge>
                        </Tooltip>
                    ))}
                </Group>
            ) : (
                <></>
            )}
            <PassedRate
                rate={showTests ? run.Rate : run.SuitesSummary}
                text={showTests ? 'Tests' : 'Suites'}
                width={'85%'}
                height={20}
            />
            <Divider orientation="horizontal" w="100%" />
            <Group gap="lg" justify="space-around">
                <PieViewOfStatus
                    text={showTests ? 'Tests' : 'Suites'}
                    rate={showTests ? run.Rate : run.SuitesSummary}
                />
                <OverviewFromRestOfTheProjects
                    run={run}
                    showTests={showTests}
                    mockData={properties.mockData}
                />
            </Group>
            <Divider orientation="horizontal" w="100%" />
        </Stack>
    );
}
