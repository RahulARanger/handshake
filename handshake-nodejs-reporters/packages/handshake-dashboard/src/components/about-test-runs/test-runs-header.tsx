import type { ReactNode } from 'react';
import React from 'react';
import {
    ActionIcon,
    Breadcrumbs,
    Divider,
    Group,
    Notification,
    Modal,
    rem,
    Skeleton,
    Text,
    Affix,
} from '@mantine/core';
import ApplicationName from 'components/about-test-runs/application-name';
import CountUpNumber from 'components/counter';
import { IconFilter, IconInfoCircle } from '@tabler/icons-react';
import type { optionForDateRange } from './filter-test-runs';
import FilterBox from './filter-test-runs';
import type { Dayjs } from 'dayjs';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useDisclosure } from '@mantine/hooks';
import useSWRImmutable from 'swr/immutable';
import { IconX } from '@tabler/icons-react';
import { dateTimeFormatUsed } from 'components/timings/format';

export function TestRunsPageHeader(properties: {
    totalRuns: number;
    recentRunDate: Dayjs;
    onDateRangeChange: (_: optionForDateRange[] | null) => void;
    onProjectFilterChange: (_: string | null) => void;
    allTestProjects: string[];
    toLoad?: boolean;
}): ReactNode {
    const [opened, { open, close }] = useDisclosure(false);
    const toLoad = properties.toLoad === true;
    const { data, error, isLoading } = useSWRImmutable('/about.md', () =>
        fetch('/about.md').then((response) => response?.text()),
    );
    return (
        <>
            <Group justify="space-between">
                <Group align="center">
                    <Breadcrumbs>
                        <ApplicationName />
                        <Text size="sm">
                            Runs&nbsp;
                            {toLoad ? (
                                <></>
                            ) : (
                                <sup>
                                    <CountUpNumber
                                        prefix="("
                                        suffix=")"
                                        endNumber={properties.totalRuns}
                                    />
                                </sup>
                            )}
                        </Text>
                    </Breadcrumbs>
                    <Group align="center">
                        <IconFilter
                            color="white"
                            style={{ width: rem(15), height: rem(15) }}
                        />
                        <Divider orientation="vertical" />
                        {toLoad ? (
                            <Skeleton animate w={200} h={25} />
                        ) : (
                            <FilterBox
                                recentRunDate={properties.recentRunDate}
                                setOfProjects={[
                                    ...new Set(properties.allTestProjects),
                                ]}
                                onDateRangeChange={properties.onDateRangeChange}
                                onProjectFilterChange={
                                    properties.onProjectFilterChange
                                }
                            />
                        )}
                    </Group>
                </Group>
                <Group align="center">
                    {isLoading ? (
                        <></>
                    ) : (
                        <Text size="xs" c="dimmed">
                            Last Test Ran at:&nbsp;&nbsp;
                            <Text td="underline" component="span" c="white">
                                {properties.recentRunDate.format(
                                    dateTimeFormatUsed,
                                )}
                            </Text>
                        </Text>
                    )}
                    {isLoading ? (
                        <Skeleton w={15} h={15} circle animate />
                    ) : (
                        <ActionIcon variant="default" onClick={open}>
                            <IconInfoCircle
                                style={{ width: rem(15), height: rem(15) }}
                            />
                        </ActionIcon>
                    )}
                </Group>
                <Modal
                    centered
                    size="lg"
                    opened={opened}
                    onClose={close}
                    title={'About'}
                >
                    <MarkdownPreview
                        source={data ?? ''}
                        style={{ padding: '24px' }}
                    />
                </Modal>
            </Group>
            {error ? (
                <Affix position={{ bottom: 20, right: 20 }}>
                    <Notification
                        icon={<IconX />}
                        color="red"
                        title="Failed to get readme"
                        mt="md"
                        withBorder
                        withCloseButton={false}
                    >
                        {`Failed to get the readme file, ${error}, Please refresh the page once.`}
                    </Notification>
                </Affix>
            ) : (
                <></>
            )}
        </>
    );
}
