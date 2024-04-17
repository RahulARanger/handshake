import { AppShell, ScrollAreaAutosize, Skeleton } from '@mantine/core';
import { Group, Tabs } from '@mantine/core';
import RelativeDate from 'components/timings/relative-date';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import CurrentLocation, { TestRunTab } from './current-location';
import useSWRImmutable from 'swr/immutable';
import { jsonFeedAboutTestRun } from 'components/links';
import transformTestRunRecord from 'extractors/transform-run-record';
import { TestRunRecord } from 'types/test-run-records';
import dayjs from 'dayjs';

export default function RunPageContent(properties: {
    testID?: string;
    children: ReactNode;
    where: TestRunTab;
}): ReactNode {
    const {
        data: rawRun,
        isLoading,
        error,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : null,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const run = useMemo(
        () => rawRun && transformTestRunRecord(rawRun),
        [rawRun],
    );

    const toLoad = isLoading || !properties.testID || error !== undefined;

    return (
        <AppShell header={{ height: 50 }}>
            <AppShell.Header p="xs">
                <Group justify="space-between" align="center">
                    <CurrentLocation
                        projectName={run?.projectName ?? ''}
                        where={properties.where}
                        toLoad={toLoad}
                    />
                    <Group align="flex-end">
                        <Tabs
                            // value={router.query.activeTab as string}
                            // onChange={(value) => router.push(`/tabs/${value}`)}
                            variant="outline"
                            defaultValue={properties.where}
                        >
                            <Tabs.List>
                                <Tabs.Tab value={'Overview' as TestRunTab}>
                                    Overview
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs>
                        {toLoad ? (
                            <Skeleton
                                animate
                                visible={toLoad}
                                width={113}
                                height={30}
                            />
                        ) : (
                            <RelativeDate
                                date={run?.Started ?? dayjs()}
                                size="sm"
                            />
                        )}
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Main>
                <ScrollAreaAutosize
                    p="md"
                    style={{ overflowX: 'hidden' }}
                    h={'calc(100vh - var(--app-shell-header-height, 0px))'}
                >
                    {properties.children}
                </ScrollAreaAutosize>
            </AppShell.Main>
        </AppShell>
    );
}
