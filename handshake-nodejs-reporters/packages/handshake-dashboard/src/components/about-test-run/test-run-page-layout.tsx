import {
    AppShell,
    ScrollAreaAutosize,
    Skeleton,
    Text,
    Group,
    Tabs,
    rem,
    Button,
} from '@mantine/core';
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
import { jsonFeedAboutTestRun, jsonFeedForSuite } from 'components/links';
import useSWRImmutable from 'swr/immutable';
import type { TestRunRecord } from 'types/test-run-records';
import type { SuiteRecordDetails } from 'types/test-entity-related';
import { IconFileExcel } from '@tabler/icons-react';

export default function RunPageContent(properties: {
    testID?: string;
    children: ReactNode;
    where: TestRunTab;
    inSuiteOf?: string;
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

    const {
        data: aboutSuite,
        isLoading: loadingSuiteInfo,
        error: errorWhileFetchingSuiteDetails,
    } = useSWRImmutable<SuiteRecordDetails>(
        properties.testID && properties.inSuiteOf
            ? jsonFeedForSuite(properties.testID, properties.inSuiteOf)
            : undefined,
        () =>
            fetch(
                jsonFeedForSuite(
                    properties.testID as string,
                    properties.inSuiteOf as string,
                ),
            ).then(async (response) => response.json()),
    );

    const router = useRouter();

    const toLoad =
        loadingSuiteInfo ||
        isLoading ||
        !properties.testID ||
        error !== undefined ||
        errorWhileFetchingSuiteDetails !== undefined;

    return (
        <AppShell header={{ height: 50 }}>
            <AppShell.Header p="xs">
                <Group justify="space-between" align="center" wrap="nowrap">
                    <CurrentLocation
                        projectName={run?.projectName ?? ''}
                        where={properties.where}
                        toLoad={toLoad}
                        testID={run?.Id}
                        isSuiteDetailedView={Boolean(properties.inSuiteOf)}
                    />

                    <Group align="flex-end" wrap="nowrap">
                        {run?.ExcelExportUrl ? (
                            <Button
                                variant="subtle"
                                component="a"
                                color="gray"
                                leftSection={
                                    <IconFileExcel
                                        color="green"
                                        style={{
                                            width: rem(18),
                                            height: rem(18),
                                        }}
                                        stroke={2}
                                    />
                                }
                                href={run.ExcelExportUrl}
                                mb={1}
                            >
                                Excel Report
                            </Button>
                        ) : (
                            <></>
                        )}
                        {aboutSuite ? (
                            <Text size="xs" fs="italic" lineClamp={1} maw={400}>
                                {aboutSuite.title}
                            </Text>
                        ) : (
                            <Tabs
                                onChange={(value) =>
                                    !toLoad &&
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
                                    <Tabs.Tab
                                        value={'Overview' as TestRunTab}
                                        disabled={toLoad}
                                    >
                                        Overview
                                    </Tabs.Tab>
                                    <Tabs.Tab
                                        value={'Suites' as TestRunTab}
                                        disabled={toLoad}
                                    >
                                        Suites
                                    </Tabs.Tab>
                                </Tabs.List>
                            </Tabs>
                        )}
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
