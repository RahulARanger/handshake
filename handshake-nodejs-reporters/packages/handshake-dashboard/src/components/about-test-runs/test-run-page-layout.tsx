import type { ReactNode } from 'react';
import React, { useMemo, useState } from 'react';
import { Affix, AppShell, Center, Stack, Text } from '@mantine/core';
import { ListOfRuns } from 'components/about-test-run/run-cards';
import type { DetailedTestRecord } from 'types/parsed-records';
import { TestRunsPageHeader } from 'components/about-test-runs/test-runs-header';
import ApplicationName from './application-name';
import dayjs from 'dayjs';
import filterEntities from '../../extractors/filter-entities-by-date-ranges';
import type { optionForDateRange } from './filter-test-runs';
import TestRunsChartArea from './test-runs-chart-area';

export function RunsPageContent(properties: {
    runs: DetailedTestRecord[];
    about: string;
}): ReactNode {
    const [filters, setFilters] = useState<{
        projectName: string | null | undefined;
        dateRanges: optionForDateRange[] | null | undefined;
    }>({
        projectName: undefined,
        dateRanges: undefined,
    });

    const projectNames = useMemo(
        () => properties.runs.map((run) => run.projectName),
        [properties.runs],
    );
    if (properties.runs.length === 0) {
        return (
            <Center>
                <Stack align="center">
                    <Text c="gray" size="sm">
                        No Test Runs found. Please execute your tests.
                    </Text>
                    <ApplicationName showLink />
                </Stack>
            </Center>
        );
    }

    const filteredRuns = properties.runs.filter((run) => {
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
                width: 360,
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
                    totalRuns={filteredRuns.length}
                    about={properties.about}
                    allTestProjects={projectNames}
                    recentRunDate={properties.runs[0]?.Started ?? dayjs()}
                    onDateRangeChange={(_) =>
                        setFilters({ ...filters, dateRanges: _ })
                    }
                    onProjectFilterChange={(_) =>
                        setFilters({ ...filters, projectName: _ })
                    }
                />
            </AppShell.Header>
            {filteredRuns.length > 0 ? (
                <>
                    <AppShell.Navbar p="xs">
                        <ListOfRuns runs={filteredRuns} mah={'100%'} />
                    </AppShell.Navbar>
                    <AppShell.Main>
                        <TestRunsChartArea
                            h={
                                'calc(100vh - var(--app-shell-header-height, 0px))'
                            }
                            chartWidth={
                                'calc(93vw - var(--app-shell-navbar-width, 0px))'
                            }
                            runs={filteredRuns}
                        />
                    </AppShell.Main>
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
