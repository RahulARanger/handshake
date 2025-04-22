import type { ReactNode } from 'react';
import React, { useMemo, useState } from 'react';
import {
    Affix,
    AppShell,
    ComboboxItemGroup,
    Notification,
    ScrollAreaAutosize,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import { ListOfRuns } from 'components/about-test-runs/run-cards';
import { TestRunsPageHeader } from 'components/about-test-runs/test-runs-header';
import ApplicationName from './application-name';
import dayjs from 'dayjs';
import filterEntities from '../../extractors/filter-entities-by-date-ranges';
import type { optionForDateRange } from './filter-test-runs';
import TestRunsChartArea from './test-runs-chart-area';
import useSWRImmutable from 'swr/immutable';
import { jsonFeedForRunsPage } from 'components/links';
import { IconX } from '@tabler/icons-react';
import MirrorHeader from 'styles/header.module.css';
import type { TestRunRecord } from 'types/test-run-records';
import transformTestRunRecord from 'extractors/transform-run-record';
import { Tag } from 'types/test-entity-related';

const tagValue = (tag: Tag) => `${tag.label}${tag.desc}`;

export function RunsPageContent(properties: {
    forceLoading?: boolean;
    mockData?: TestRunRecord[];
}): ReactNode {
    const {
        data: rawRuns,
        isLoading,
        error,
    } = useSWRImmutable<TestRunRecord[]>(
        properties.mockData ? undefined : jsonFeedForRunsPage(),
        () =>
            fetch(jsonFeedForRunsPage()).then(async (response) =>
                response.json(),
            ),
    );

    const data = useMemo(
        () =>
            (rawRuns ?? properties.mockData ?? []).map((record) =>
                transformTestRunRecord(record),
            ),
        [rawRuns, properties.mockData],
    );

    const [filters, setFilters] = useState<{
        projectName: string | null | undefined;
        dateRanges: optionForDateRange[] | null | undefined;
        tags: string[] | null | undefined;
    }>({
        projectName: undefined,
        dateRanges: undefined,
        tags: undefined,
    });

    const [projectNames, runTags] = useMemo(() => {
        const projects: string[] = [];
        const tags: Set<ComboboxItemGroup> = new Set();
        const groups: Record<string, ComboboxItemGroup> = {};
        data.map((run) => {
            projects.push(run.projectName);
            for (const tag of run.Tags) {
                if (!tag.label) continue;
                if (groups[tag.desc]) {
                    groups[tag.desc].items.push(tag.label);
                } else {
                    const group: ComboboxItemGroup = {
                        group: tag.desc,
                        items: [{ label: tag.label, value: tagValue(tag) }],
                    };
                    groups[tag.desc] = group;
                    tags.add(group);
                }
            }
        });
        return [projects, [...tags]];
    }, [data]);

    const toLoad =
        isLoading || error !== undefined || properties.forceLoading === true;

    const filteredRuns = useMemo(
        () =>
            data.filter((run) => {
                const projectFilter =
                    !filters.projectName ||
                    run.projectName === filters.projectName;
                return (
                    projectFilter &&
                    (filters.tags && filters.tags?.length > 0
                        ? run.Tags.some((tag) =>
                              filters.tags?.includes(tagValue(tag)),
                          )
                        : true) &&
                    (filters.dateRanges && filters.dateRanges?.length > 0
                        ? filterEntities(run, filters.dateRanges)
                        : true)
                );
            }),
        [data, filters],
    );

    if (!toLoad && data.length === 0) {
        return (
            <Affix position={{ top: '40%', left: '40%' }}>
                <Stack align="center">
                    <Text c="gray" size="sm">
                        No Test Runs found. Please execute your tests.
                    </Text>
                    <ApplicationName showLink />
                </Stack>
            </Affix>
        );
    }

    return (
        <AppShell
            header={{ height: 50 }}
            w={'100vw'}
            navbar={{
                width: 390,
                breakpoint: 'sm',
            }}
            aside={{
                breakpoint: 'sm',
                width: 0,
                collapsed: { desktop: true, mobile: true },
            }}
        >
            <AppShell.Header p="xs" className={MirrorHeader.mirrorHeader}>
                <TestRunsPageHeader
                    totalRuns={filteredRuns?.length ?? 0}
                    allTestProjects={projectNames}
                    recentRunDate={data?.at(0)?.Started ?? dayjs()}
                    onDateRangeChange={(_) =>
                        setFilters({ ...filters, dateRanges: _ })
                    }
                    runTags={runTags}
                    onProjectFilterChange={(_) =>
                        setFilters({ ...filters, projectName: _ })
                    }
                    onTagFilterChange={(_) =>
                        setFilters({ ...filters, tags: _ })
                    }
                    toLoad={toLoad}
                />
            </AppShell.Header>

            {toLoad || filteredRuns.length > 0 ? (
                <AppShell.Navbar
                    p="xs"
                    style={{ backgroundColor: 'transparent' }}
                >
                    <Skeleton animate={toLoad} visible={toLoad} mih={'100%'}>
                        <ListOfRuns
                            runs={filteredRuns.toReversed()}
                            mah={'100%'}
                        />
                    </Skeleton>
                </AppShell.Navbar>
            ) : (
                <></>
            )}

            {toLoad || filteredRuns.length > 0 ? (
                <>
                    <AppShell.Main
                        pt={'calc(var(--app-shell-header-height, 0px))'}
                        pr="sm"
                        pb="xs"
                    >
                        <ScrollAreaAutosize
                            h={
                                'calc(100vh - var(--app-shell-header-height, 0px))'
                            }
                            mb={15}
                        >
                            <TestRunsChartArea
                                chartWidth={
                                    'calc(95vw - var(--app-shell-navbar-width, 0px))'
                                }
                                runs={filteredRuns}
                                toLoad={toLoad}
                            />
                        </ScrollAreaAutosize>
                    </AppShell.Main>
                    {error ? (
                        <Affix position={{ bottom: '2%', left: '30%' }}>
                            <Notification
                                icon={<IconX />}
                                color="red"
                                title="Failed to get Test Runs"
                                mt="md"
                                withBorder
                                withCloseButton={false}
                            >
                                {`Failed to get the Test Runs, ${error}, Please refresh the page once.`}
                            </Notification>
                        </Affix>
                    ) : (
                        <></>
                    )}
                </>
            ) : (
                <Affix position={{ top: '40%', left: '40%' }} zIndex={-1}>
                    <Text size="sm">
                        No Test Runs were found based on the filters used.
                    </Text>
                </Affix>
            )}
        </AppShell>
    );
}
