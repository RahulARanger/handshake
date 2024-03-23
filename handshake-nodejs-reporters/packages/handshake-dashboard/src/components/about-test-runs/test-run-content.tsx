import type { ReactNode } from 'react';
import React from 'react';
import { AppShell, Center, Stack, Text } from '@mantine/core';
import { ListOfRuns } from 'components/about-test-run/run-cards';
import type { DetailedTestRecord } from 'types/parsed-records';
import { TestRunsPageHeader } from './test-runs-header';
import ApplicationName from './application-name';

export function RunsPageContent(properties: {
    runs: DetailedTestRecord[];
}): ReactNode {
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
    return (
        <AppShell header={{ height: 45 }}>
            <AppShell.Header p="xs">
                <TestRunsPageHeader totalRuns={properties.runs.length} />
            </AppShell.Header>
            <AppShell.Navbar p="xs">
                <ListOfRuns runs={properties.runs} mah={'100%'} />
            </AppShell.Navbar>
        </AppShell>
    );
}
