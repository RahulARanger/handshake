import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Breadcrumbs,
    Button,
    Card,
    Collapse,
    Divider,
    Grid,
    Group,
    Paper,
    rem,
    Skeleton,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    jsonFeedAboutTestRun,
    jsonFeedForListOfSuites,
} from 'components/links';
import { TimeRange } from 'components/timings/time-range';
import dayjs from 'dayjs';
import transformTestEntity, {
    spawnConverter,
} from 'extractors/transform-test-entity';
import { DataTable } from 'mantine-datatable';
import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';
import type {
    ErrorRecord,
    SuiteRecordDetails,
} from 'types/test-entity-related';
import type { TestRunRecord } from 'types/test-run-records';
import GridStyles from 'styles/suitesGrid.module.css';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import PlatformEntity from './platform-entity';
import type { possibleEntityNames } from 'types/session-records';
import type { ParsedSuiteRecord } from 'types/parsed-records';
import { useDisclosure } from '@mantine/hooks';
import {
    IconArrowLeft,
    IconArrowsMaximize,
    IconBrandStackshare,
    IconCaretDownFilled,
} from '@tabler/icons-react';
import filterListOfSuites from 'extractors/filter-entities-on-suites-grid';

export default function ListOfSuits(properties: {
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

    const { data, isLoading, error } = useSWRImmutable<SuiteRecordDetails[]>(
        properties.testID
            ? jsonFeedForListOfSuites(properties.testID)
            : undefined,
        () =>
            fetch(jsonFeedForListOfSuites(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );

    const suites = useMemo(() => {
        const converter = spawnConverter();
        return (data ?? []).map((suite) =>
            transformTestEntity(suite, run?.tests ?? 0, converter),
        );
    }, [run?.tests, data]);

    const [parentSuites, setParentSuites] = useState<
        Array<{ suiteID: string; title: string }>
    >([{ suiteID: '', title: 'Parent Suites' }]);

    const [pages, setPages] = useState<number[]>([1]);

    const toLoad =
        runFeedLoading ||
        isLoading ||
        error !== undefined ||
        runFeedError !== undefined ||
        run === undefined ||
        data === undefined;

    const filteredSuites = useMemo(
        () =>
            toLoad
                ? suites
                : filterListOfSuites(suites, {
                      parentSuite: parentSuites?.at(-1)?.suiteID ?? '',
                  }),
        [parentSuites, suites, toLoad],
    );
    const pageSize = 10;
    const startFrom = ((pages?.at(-1) ?? 1) - 1) * pageSize;
    const till = startFrom + pageSize;

    return (
        <Stack>
            {parentSuites?.length === 1 ? (
                <Text size="sm" c="dimmed">
                    Parent Suites
                </Text>
            ) : (
                <Group wrap="nowrap" justify="flex-left">
                    <ActionIcon
                        color="orange.8"
                        variant="subtle"
                        onClick={() => {
                            setParentSuites(() => parentSuites.slice(0, -1));
                            setPages(() => pages.slice(0, -1));
                        }}
                    >
                        <IconArrowLeft size={16} />
                    </ActionIcon>
                    <Breadcrumbs>
                        {parentSuites.map((suite, index) => (
                            <Button
                                size="xs"
                                c="dimmed"
                                p={0}
                                key={suite.suiteID}
                                variant="transparent"
                                onClick={() => {
                                    index < parentSuites.length - 1 &&
                                        setParentSuites(() =>
                                            parentSuites.slice(0, index + 1),
                                        );

                                    setPages(() => pages.slice(0, index + 1));
                                }}
                            >
                                {suite.title}
                            </Button>
                        ))}
                    </Breadcrumbs>
                </Group>
            )}
            {toLoad ? (
                <Skeleton width="100%" height="82vh" animate />
            ) : (
                <DataTable
                    records={filteredSuites.slice(startFrom, till)}
                    striped
                    highlightOnHover
                    withColumnBorders
                    withTableBorder
                    shadow="xl"
                    pinLastColumn
                    idAccessor={'Id'}
                    mr={'sm'}
                    columns={[
                        {
                            accessor: 'Status',
                            title: 'Status',
                            render: (_, index) => index + 1,
                        },
                        {
                            accessor: 'Title',
                        },
                        {
                            accessor: 'Started',
                            title: 'Range',
                            render: (record, index) => {
                                return (
                                    <TimeRange
                                        startTime={record.Started}
                                        endTime={record.Ended}
                                        key={index}
                                        detailed
                                        relativeFrom={dayjs(run.started)}
                                    />
                                );
                            },
                        },
                        {
                            accessor: 'Duration',
                            render: (record, index) => {
                                return (
                                    <HumanizedDuration
                                        duration={record.Duration}
                                        key={index}
                                    />
                                );
                            },
                        },
                        {
                            accessor: 'entityName',
                            title: 'Platform',
                            render: (record) => {
                                return (
                                    <PlatformEntity
                                        entityName={
                                            record.entityName as possibleEntityNames
                                        }
                                        size="sm"
                                        entityVersion={record.entityVersion}
                                        simplified={record.simplified}
                                    />
                                );
                            },
                        },
                        {
                            accessor: 'numberOfErrors',
                            title: 'Errors',
                            cellsClassName: (record) =>
                                record.Status === 'FAILED'
                                    ? GridStyles.redRow
                                    : undefined,
                        },
                        {
                            accessor: 'totalRollupValue',
                            title: 'Tests',
                            render: (record) => {
                                return (
                                    <Group
                                        gap={5}
                                        justify="space-between"
                                        wrap="nowrap"
                                    >
                                        <Text size="xs">
                                            {record.totalRollupValue}
                                        </Text>
                                        <Divider
                                            color="dimmed"
                                            size="xs"
                                            orientation="vertical"
                                        />
                                        <Group gap={2} wrap="nowrap">
                                            <Tooltip
                                                color="green.8"
                                                label="Passed"
                                            >
                                                <Badge
                                                    color="green.6"
                                                    size="xs"
                                                    variant="light"
                                                >
                                                    {record.Rate[0]}
                                                </Badge>
                                            </Tooltip>
                                            <Tooltip
                                                color="red.8"
                                                label="Failed"
                                            >
                                                <Badge
                                                    variant="light"
                                                    color="red.9"
                                                    size="xs"
                                                >
                                                    {record.Rate[1]}
                                                </Badge>
                                            </Tooltip>
                                            <Tooltip
                                                color="yellow.9"
                                                label="Skipped"
                                            >
                                                <Badge
                                                    color="yellow.9"
                                                    size="xs"
                                                    variant="light"
                                                >
                                                    {record.Rate[2]}
                                                </Badge>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                );
                            },
                        },
                        {
                            accessor: 'File',
                        },
                        {
                            accessor: 'Contribution',
                            title: 'Contrib.',
                            render: (record) =>
                                String(record.Contribution) + '%',
                        },
                        {
                            accessor: 'actions',
                            title: <Box mr={6}>Row actions</Box>,
                            textAlign: 'center',
                            render: (record) => (
                                <Group gap={4} justify="center" wrap="nowrap">
                                    {record.hasChildSuite ? (
                                        <Tooltip
                                            color="green"
                                            label="Drill-down to child suites"
                                        >
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                color="green"
                                                onClick={() => {
                                                    setParentSuites(() => [
                                                        ...parentSuites,
                                                        {
                                                            suiteID: record.Id,
                                                            title: record.Title,
                                                        },
                                                    ]);
                                                    setPages(() => [
                                                        ...pages,
                                                        1,
                                                    ]);
                                                }}
                                            >
                                                <IconBrandStackshare
                                                    size={16}
                                                />
                                            </ActionIcon>
                                        </Tooltip>
                                    ) : (
                                        <></>
                                    )}
                                    <Tooltip
                                        color="blue"
                                        label="Open Detailed View for this suite"
                                    >
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color="blue"
                                            // onClick={() =>
                                            //     showModal({
                                            //         company,
                                            //         action: 'edit',
                                            //     })
                                            // }
                                        >
                                            <IconArrowsMaximize size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            ),
                        },
                    ]}
                    rowExpansion={{
                        trigger: 'click',
                        collapseProps: {
                            transitionDuration: 200,
                            animateOpacity: false,
                            transitionTimingFunction: 'ease-out',
                        },
                        allowMultiple: true,
                        content: ({ record }) => {
                            return <SuiteDetailedView record={record} />;
                        },
                    }}
                    recordsPerPage={pageSize}
                    totalRecords={filteredSuites.length}
                    page={pages?.at(-1) ?? 1}
                    onPageChange={(p) => {
                        setPages([...pages.slice(0, -1), p]);
                    }}
                />
            )}
        </Stack>
    );
}

function SuiteDetailedView(properties: {
    record: ParsedSuiteRecord;
}): ReactNode {
    const record = properties.record;
    return (
        <Card withBorder radius="md" shadow="xl">
            <Card.Section withBorder p="xs">
                <Text size="sm">Description</Text>
            </Card.Section>
            {record.Desc ? (
                <Card.Section p="sm" px="sm">
                    <Text size="sm">{record.Desc}</Text>
                </Card.Section>
            ) : (
                <></>
            )}

            <Card.Section p="xs">
                {record.Desc ? (
                    <Text size="sm" c="dimmed">
                        {record.Desc}
                    </Text>
                ) : (
                    <Text size="xs" c="dimmed" fs="italic">
                        No Description Provided
                    </Text>
                )}
            </Card.Section>
            <Card.Section withBorder p="xs">
                <Group justify="space-between" wrap="nowrap">
                    <Text size="sm">Errors</Text>
                    <Badge color="red.9" variant="light" size="sm">
                        {record.numberOfErrors}
                    </Badge>
                </Group>
            </Card.Section>
            <Card.Section p="xs">
                {record.errors.length > 0 ? (
                    <Grid p="sm">
                        {record.errors.map((error, index) => (
                            <Grid.Col span="content" key={index}>
                                <ErrorCard error={error} key={index} />
                            </Grid.Col>
                        ))}
                    </Grid>
                ) : (
                    <Alert color="green" title="No Errors Found" />
                )}
            </Card.Section>
        </Card>
    );
}

export function ErrorCard(properties: { error: ErrorRecord }): ReactNode {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <Card shadow="lg" withBorder radius="md">
            {/* <Card.Section p="xs" withBorder>
                <Text size="sm">{properties.error.mailedFrom}</Text>
            </Card.Section> */}

            <Card.Section p="xs" withBorder={opened} onClick={toggle}>
                <Group justify="space-between">
                    <Text
                        size="sm"
                        dangerouslySetInnerHTML={{
                            __html: properties.error.message ?? '',
                        }}
                    />
                    <ActionIcon size="xs" variant="light" onClick={toggle}>
                        <IconCaretDownFilled
                            style={{
                                width: rem(12),
                                height: rem(12),
                            }}
                            stroke={1.5}
                        />
                    </ActionIcon>
                </Group>
            </Card.Section>

            <Collapse in={opened} py="xs">
                <Card.Section p="sm">
                    <Paper shadow="md" withBorder radius="sm" p="sm">
                        <Text
                            size="xs"
                            dangerouslySetInnerHTML={{
                                __html: properties.error.stack ?? '',
                            }}
                        />
                    </Paper>
                </Card.Section>
            </Collapse>
        </Card>
    );
}
