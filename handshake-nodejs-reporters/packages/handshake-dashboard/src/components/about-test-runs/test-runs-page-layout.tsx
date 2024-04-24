import type { ReactNode } from 'react';
import React, { useMemo, useState } from 'react';
import {
    Affix,
    AppShell,
    Notification,
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
import type { TestRunRecord } from 'types/test-run-records';
import transformTestRunRecord from 'extractors/transform-run-record';

export function RunsPageContent(properties: {
    forceLoading?: boolean;
}): ReactNode {
    const {
        data: rawRuns,
        isLoading,
        error,
    } = useSWRImmutable<TestRunRecord[]>(jsonFeedForRunsPage(), () =>
        fetch(jsonFeedForRunsPage()).then(async (response) => response.json()),
    );

    const data = useMemo(
        () => (rawRuns ?? []).map((record) => transformTestRunRecord(record)),
        [rawRuns],
    );

    const [filters, setFilters] = useState<{
        projectName: string | null | undefined;
        dateRanges: optionForDateRange[] | null | undefined;
    }>({
        projectName: undefined,
        dateRanges: undefined,
    });

    const projectNames = useMemo(
        () => data.map((run) => run.projectName),
        [data],
    );

    const toLoad =
        isLoading || error !== undefined || properties.forceLoading === true;

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

    const filteredRuns = data.filter((run) => {
        const projectFilter =
            !filters.projectName || run.projectName === filters.projectName;
        if (!filters.dateRanges || filters.dateRanges.length === 0)
            return projectFilter;

        return projectFilter && filterEntities(run, filters.dateRanges);
    });

    return (
        <AppShell
            header={{ height: 50 }}
            navbar={{
                width: 376,
                breakpoint: 'sm',
            }}
            aside={{
                breakpoint: 'sm',
                width: 0,
                collapsed: { desktop: true, mobile: true },
            }}
        >
            <AppShell.Header p="xs">
                <TestRunsPageHeader
                    totalRuns={filteredRuns?.length ?? 0}
                    allTestProjects={projectNames}
                    recentRunDate={data?.at(0)?.Started ?? dayjs()}
                    onDateRangeChange={(_) =>
                        setFilters({ ...filters, dateRanges: _ })
                    }
                    onProjectFilterChange={(_) =>
                        setFilters({ ...filters, projectName: _ })
                    }
                    toLoad={toLoad}
                />
            </AppShell.Header>

            {toLoad || filteredRuns.length > 0 ? (
                <AppShell.Navbar p="xs">
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
                    <AppShell.Main>
                        <TestRunsChartArea
                            h={
                                'calc(100vh - var(--app-shell-header-height, 0px))'
                            }
                            chartWidth={
                                'calc(93vw - var(--app-shell-navbar-width, 0px))'
                            }
                            runs={filteredRuns}
                            toLoad={toLoad}
                        />
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
