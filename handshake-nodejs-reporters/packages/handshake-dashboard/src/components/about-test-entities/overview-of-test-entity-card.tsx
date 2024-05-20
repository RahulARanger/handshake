import {
    Badge,
    Card,
    Group,
    rem,
    ActionIcon,
    Skeleton,
    Text,
    Tooltip,
    Grid,
    Paper,
    Stack,
    Tabs,
    ScrollArea,
} from '@mantine/core';
import TestStatusRing from 'components/about-test-run/test-status-ring';
import MarkdownPreview from '@uiw/react-markdown-preview';
import {
    jsonFeedAboutTestRun,
    jsonFeedForRetryMap,
    jsonFeedForSuite,
    suiteDetailedPage,
} from 'components/links';
import transformSuiteEntity, {
    spawnConverterForAnsiToHTML,
} from 'extractors/transform-test-entity';

import type { ReactNode } from 'react';
import React, { useMemo, useState } from 'react';
import useSWRImmutable from 'swr/immutable';
import type { ParsedSuiteRecord } from 'types/parsed-records';

import type {
    RetriedRawRecord,
    RetriedRecord,
    SuiteRecordDetails,
} from 'types/test-entity-related';
import type { TestRunRecord } from 'types/test-run-records';
import { SuiteBadges } from './suite-badge';
import RelativeDate from 'components/timings/relative-date';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import dayjs from 'dayjs';
import CountUpNumber from 'components/counter';
import TestStatusIcon from 'components/about-test-run/test-status';
import SwitchTestCases from 'components/test-case-switch';
import ErrorCard from './error-card';
import PlatformEntity from './platform-entity';
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconChevronUp,
} from '@tabler/icons-react';
import TestStatusBar from './test-startus-bar';
import { useRouter } from 'next/router';

export function OverviewRow(properties: {
    suite?: ParsedSuiteRecord;
    testStartedAt: string;
    retriedIndex?: number;
}): ReactNode {
    const suite = properties.suite;

    return suite ? (
        <Paper shadow="xl" withBorder p="sm">
            <Group justify="space-between">
                <Group gap={'sm'}>
                    <PlatformEntity
                        entityNames={[suite.entityName]}
                        size="sm"
                    />
                    <SuiteBadges
                        record={suite}
                        retriedIndex={properties.retriedIndex}
                    />
                    <TestStatusIcon status={suite.Status} />
                    <Text size="sm" c="dimmed">
                        {suite.Title}
                    </Text>
                </Group>
                <Group gap={8} align="baseline">
                    <CountUpNumber
                        endNumber={suite.totalRollupValue}
                        prefix={'Executed&nbsp;'}
                        suffix="&nbsp;Tests"
                        size="sm"
                    />
                    <Badge color="cyan" variant="light" size="sm" tt="none">
                        <RelativeDate
                            date={suite.Started}
                            size="xs"
                            relativeFrom={dayjs(properties.testStartedAt)}
                            showTime
                            relativeAlias="Test Run Start"
                            prefix="On&nbsp;"
                        />
                    </Badge>
                    <Badge color="violet" variant="light" size="sm" tt="none">
                        <HumanizedDuration
                            duration={suite.Duration}
                            size="xs"
                        />
                    </Badge>
                </Group>
            </Group>
        </Paper>
    ) : (
        <Skeleton height={51.33} width="100%" />
    );
}

export function OverviewTabs(properties: {
    suite?: ParsedSuiteRecord;
    testID: string;
}): ReactNode {
    const errorsFound = properties.suite?.numberOfErrors ?? 0;
    let defaultValue = 'errors';

    if ((properties.suite?.Desc?.length ?? 0) > 0) defaultValue = 'description';
    if (errorsFound > 0) defaultValue = 'errors';

    return properties.suite ? (
        <Tabs defaultValue={defaultValue} style={{ height: '100%' }}>
            <Paper
                style={{ position: 'sticky', top: 0.1, zIndex: 3 }}
                withBorder
                shadow="xl"
            >
                <Tabs.List>
                    <Group justify="space-between" wrap="nowrap" w={'100%'}>
                        <Group wrap="nowrap" pt="xs" pl="xs" gap={0.5}>
                            <Tabs.Tab value="description">Description</Tabs.Tab>
                            <Tabs.Tab
                                value="errors"
                                c={errorsFound ? 'red' : 'green'}
                                disabled={errorsFound === 0}
                            >
                                {errorsFound
                                    ? `Errors (${errorsFound})`
                                    : 'No Errors Found.'}
                            </Tabs.Tab>
                        </Group>
                        <TestStatusBar
                            testID={properties.testID}
                            suiteID={properties.suite.Id}
                        />
                    </Group>
                </Tabs.List>
            </Paper>
            <Tabs.Panel value="description" h={'100%'}>
                <MarkdownPreview
                    style={{ height: '100%', padding: '24px' }}
                    source={
                        properties.suite?.Desc ||
                        '_No Description was Provided_'
                    }
                />
            </Tabs.Panel>
            <Tabs.Panel value="errors">
                <Stack p="sm">
                    {properties.suite?.errors.map((error, index) => (
                        <ErrorCard error={error} key={index} />
                    ))}
                </Stack>
            </Tabs.Panel>
        </Tabs>
    ) : (
        <Skeleton h={320} animate />
    );
}

export default function OverviewCard(properties: {
    suiteID?: string;
    testID?: string;
}): ReactNode {
    const {
        data: run,
        isLoading: runFeedLoading,
        error: runFeedError,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const {
        data: retriedMap,
        isLoading: retriedLoading,
        error: retriedMapFeedError,
    } = useSWRImmutable<Record<string, RetriedRawRecord>>(
        properties.testID && properties.suiteID
            ? jsonFeedForRetryMap(properties.testID, properties.suiteID)
            : undefined,
        () =>
            fetch(
                jsonFeedForRetryMap(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );

    const { data, isLoading, error } = useSWRImmutable<SuiteRecordDetails>(
        properties.testID && properties.suiteID
            ? jsonFeedForSuite(properties.testID, properties.suiteID)
            : undefined,
        () =>
            fetch(
                jsonFeedForSuite(
                    properties.testID as string,
                    properties.suiteID as string,
                ),
            ).then(async (response) => response.json()),
    );

    const suite = useMemo(() => {
        const converter = spawnConverterForAnsiToHTML();
        return data && transformSuiteEntity(data, run?.tests ?? 0, converter);
    }, [run?.tests, data]);

    const router = useRouter();

    const toLoad =
        isLoading ||
        retriedLoading ||
        runFeedLoading ||
        error !== undefined ||
        runFeedError !== undefined ||
        retriedMapFeedError !== undefined ||
        !data ||
        !run;

    const [showRolledUp, setRolledUp] = useState<boolean>(true);

    const rateValues = showRolledUp ? suite?.RollupValues : suite?.Rate;
    const totalEntity = showRolledUp ? suite?.totalRollupValue : suite?.Tests;
    const retriedMapRecord = useMemo<RetriedRecord | undefined>(() => {
        if (!properties?.suiteID || !retriedMap) return;
        const record = retriedMap[properties.suiteID];
        if (!record) return;
        return {
            ...record,
            tests: JSON.parse(record?.tests ?? '[]'),
        };
    }, [retriedMap, properties.suiteID]);

    const previousRetriedRecord =
        retriedMapRecord?.tests[retriedMapRecord?.key - 1];
    const nextRetriedRecord =
        retriedMapRecord?.tests[retriedMapRecord?.key + 1];

    return (
        <Stack
            mr={10}
            style={{
                height: '100%',
            }}
        >
            <OverviewRow
                suite={suite}
                testStartedAt={run?.started ?? ''}
                retriedIndex={(retriedMapRecord?.key ?? 0) + 1}
            />
            <Grid columns={2}>
                <Grid.Col span={0.44}>
                    <Card p="sm" withBorder shadow="lg" radius="lg">
                        <Card.Section withBorder p="xs" px="md">
                            <Group justify="space-between">
                                <CountUpNumber
                                    endNumber={totalEntity ?? 0}
                                    prefix={
                                        showRolledUp ? 'All Tests: ' : 'Tests: '
                                    }
                                    size="sm"
                                />
                                <Group wrap="nowrap" gap="xs" align="center">
                                    {[
                                        {
                                            title: 'Prev. Retried Suite',
                                            icon: (
                                                <IconChevronsLeft
                                                    style={{
                                                        width: rem(16),
                                                        height: rem(16),
                                                    }}
                                                    stroke={1.5}
                                                />
                                            ),
                                            url:
                                                properties.testID &&
                                                previousRetriedRecord
                                                    ? suiteDetailedPage(
                                                          properties.testID,
                                                          previousRetriedRecord,
                                                      )
                                                    : '',
                                        },
                                        {
                                            title: 'Previous Suite',
                                            icon: (
                                                <IconChevronLeft
                                                    style={{
                                                        width: rem(16),
                                                        height: rem(16),
                                                    }}
                                                    stroke={1.5}
                                                />
                                            ),
                                            url:
                                                properties.testID &&
                                                suite?.PrevSuite
                                                    ? suiteDetailedPage(
                                                          properties.testID as string,
                                                          suite?.PrevSuite as string,
                                                      )
                                                    : '',
                                        },
                                        {
                                            title: 'Parent Suite',
                                            icon: (
                                                <IconChevronUp
                                                    style={{
                                                        width: rem(16),
                                                        height: rem(16),
                                                    }}
                                                    stroke={1.5}
                                                />
                                            ),
                                            url:
                                                properties.testID &&
                                                suite?.Parent
                                                    ? suiteDetailedPage(
                                                          properties.testID,
                                                          suite.Parent,
                                                      )
                                                    : '',
                                        },
                                        {
                                            title: 'Next Suite',
                                            icon: (
                                                <IconChevronRight
                                                    style={{
                                                        width: rem(16),
                                                        height: rem(16),
                                                    }}
                                                    stroke={1.5}
                                                />
                                            ),
                                            url:
                                                properties.testID &&
                                                suite?.NextSuite
                                                    ? suiteDetailedPage(
                                                          properties.testID,
                                                          suite.NextSuite,
                                                      )
                                                    : '',
                                        },
                                        {
                                            title: 'Next Retried Suite',
                                            icon: (
                                                <IconChevronsRight
                                                    style={{
                                                        width: rem(16),
                                                        height: rem(16),
                                                    }}
                                                    stroke={1.5}
                                                />
                                            ),
                                            url:
                                                properties.testID &&
                                                nextRetriedRecord
                                                    ? suiteDetailedPage(
                                                          properties.testID,
                                                          nextRetriedRecord,
                                                      )
                                                    : '',
                                        },
                                    ]
                                        .filter((x) => x !== undefined)
                                        .map(({ icon, title, url }) => (
                                            <Tooltip
                                                label={title}
                                                color="pink"
                                                key={title}
                                            >
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    disabled={!url}
                                                    radius={'sm'}
                                                    ml={0}
                                                    onClick={() =>
                                                        router.push(url)
                                                    }
                                                >
                                                    {icon}
                                                </ActionIcon>
                                            </Tooltip>
                                        ))}
                                </Group>
                            </Group>
                        </Card.Section>
                        <Card.Section p="sm">
                            <Group align="center" gap={1}>
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '3%',
                                        right: '3%',
                                        zIndex: 2,
                                    }}
                                >
                                    <SwitchTestCases
                                        replaceSuiteLabel="Rolled Up"
                                        replaceTestLabel="Direct"
                                        isDefaultTestCases={false}
                                        trackWidth={80}
                                        onChange={(isDirect) =>
                                            setRolledUp(!isDirect)
                                        }
                                    />
                                </div>
                                <TestStatusRing
                                    rateValues={rateValues}
                                    totalEntity={totalEntity}
                                    toLoad={toLoad}
                                    labelText={'Tests'}
                                />
                            </Group>
                        </Card.Section>
                    </Card>
                </Grid.Col>
                <Grid.Col span={1.56}>
                    <Card p="sm" withBorder shadow="lg" radius="lg">
                        <Card.Section>
                            <ScrollArea h={320}>
                                <OverviewTabs
                                    testID={run?.testID as string}
                                    suite={suite}
                                />
                            </ScrollArea>
                        </Card.Section>
                    </Card>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}
