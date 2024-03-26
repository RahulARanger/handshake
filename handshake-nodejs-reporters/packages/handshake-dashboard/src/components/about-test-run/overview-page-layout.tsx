import type { ReactNode } from 'react';
import React from 'react';
import { AppShell, Group } from '@mantine/core';
import type { DetailedTestRecord } from 'types/parsed-records';
import Header from './header';
import OverviewCard from './test-status-ring';

export function RunPageContent(properties: {
    run: DetailedTestRecord;
    isInOverview?: boolean;
}): ReactNode {
    return (
        <AppShell
            header={{ height: 48 }}
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
                <Header
                    date={properties.run.Started}
                    inOverview={properties.isInOverview}
                    projectName={properties.run.projectName}
                />
            </AppShell.Header>
            <AppShell.Main>
                <Group>
                    {/* <OverviewCard at={properties.run.Started} duration={properties.run.Duration} rate={properties.run.Rate} suites={properties.run.SuitesSummary} totalSuites={properties.run.Suites} totalTests={properties.run.Tests} /> */}
                </Group>
            </AppShell.Main>
        </AppShell>
    );
}
