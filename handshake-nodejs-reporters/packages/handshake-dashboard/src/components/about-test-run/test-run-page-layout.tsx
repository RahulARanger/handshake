import { AppShell, ScrollAreaAutosize, Skeleton } from '@mantine/core';
import { Group, Tabs } from '@mantine/core';
import RelativeDate from 'components/timings/relative-date';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import type { TestRunTab } from './current-location';
import CurrentLocation, {
    redirectToRightPageForTestRun,
} from './current-location';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import transformTestRunRecord from 'extractors/transform-run-record';
import { jsonFeedAboutTestRun } from 'components/links';
import useSWRImmutable from 'swr/immutable';
import type { TestRunRecord } from 'types/test-run-records';

export default function RunPageContent(properties: {
    testID?: string;
    children: ReactNode;
    where: TestRunTab;
    avoidScrollWindow?: boolean;
}): ReactNode {
    const {
        data: rawRun,
        isLoading,
        error,
    } = useSWRImmutable<TestRunRecord>(
        properties.testID ? jsonFeedAboutTestRun(properties.testID) : undefined,
        () =>
            fetch(jsonFeedAboutTestRun(properties.testID as string)).then(
                async (response) => response.json(),
            ),
    );
    const run = useMemo(
        () => rawRun && transformTestRunRecord(rawRun),
        [rawRun],
    );

    const router = useRouter();

    const toLoad = isLoading || !properties.testID || error !== undefined;

    return (
        <AppShell header={{ height: 50 }}>
            <AppShell.Header p="xs">
                <Group justify="space-between" align="center">
                    <CurrentLocation
                        projectName={run?.projectName ?? ''}
                        where={properties.where}
                        toLoad={toLoad}
                        testID={run?.Id}
                    />
                    <Group align="flex-end">
                        <Tabs
                            onChange={(value) =>
                                redirectToRightPageForTestRun(
                                    router,
                                    run?.Id as string,
                                    value as TestRunTab,
                                )
                            }
                            variant="outline"
                            defaultValue={properties.where}
                        >
                            <Tabs.List>
                                <Tabs.Tab value={'Overview' as TestRunTab}>
                                    Overview
                                </Tabs.Tab>
                                <Tabs.Tab value={'Suites' as TestRunTab}>
                                    Suites
                                </Tabs.Tab>
                            </Tabs.List>
                        </Tabs>
                        {toLoad ? (
                            <Skeleton
                                animate
                                visible={toLoad}
                                width={113}
                                height={28}
                                mb={10}
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
                {properties.avoidScrollWindow ? (
                    properties.children
                ) : (
                    <ScrollAreaAutosize
                        py="sm"
                        pl="sm"
                        pr={4}
                        style={{ overflowX: 'hidden' }}
                        h={'calc(100vh - var(--app-shell-header-height, 0px))'}
                    >
                        {properties.children}
                    </ScrollAreaAutosize>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
