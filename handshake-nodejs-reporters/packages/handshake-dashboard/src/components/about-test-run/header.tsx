import {
    AppShellHeader,
    Button,
    Group,
    rem,
    Skeleton,
    Tabs,
    Text,
} from '@mantine/core';
import RelativeDate from 'components/timings/relative-date';
import CurrentLocation, {
    redirectToRightPageForTestRun,
    TestRunTab,
} from './current-location';
import { IconFileExcel } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import useSWRImmutable from 'swr';
import { jsonFeedForSuite } from 'components/links';
import { SuiteRecordDetails } from 'types/test-entity-related';
import MirrorHeader from 'styles/header.module.css';
import { DetailedTestRecord } from 'types/parsed-records';

export default function Header(properties: {
    inSuiteOf?: string;
    where: TestRunTab;
    run?: DetailedTestRecord;
}) {
    const run = properties.run;
    const {
        data: aboutSuite,
        isLoading: loadingSuiteInfo,
        error: errorWhileFetchingSuiteDetails,
    } = useSWRImmutable<SuiteRecordDetails>(
        properties.run && properties.inSuiteOf
            ? jsonFeedForSuite(properties.run.Id, properties.inSuiteOf)
            : undefined,
        () =>
            fetch(
                jsonFeedForSuite(
                    properties.run?.Id as string,
                    properties.inSuiteOf as string,
                ),
            ).then(async (response) => response.json()),
    );

    const toLoad =
        loadingSuiteInfo ||
        Boolean(run) ||
        errorWhileFetchingSuiteDetails !== undefined;

    console.log(toLoad, loadingSuiteInfo, properties);

    const router = useRouter();
    return (
        <AppShellHeader
            style={{ borderBottomColor: 'transparent' }}
            className={MirrorHeader.mirrorHeader}
        >
            <Group
                justify="space-between"
                px="md"
                pt="xs"
                align="center"
                wrap="nowrap"
            >
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
                            visibleFrom="sm"
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
        </AppShellHeader>
    );
}
