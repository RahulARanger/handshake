import type { ReactNode } from 'react';
import React from 'react';
import {
    ActionIcon,
    Breadcrumbs,
    Divider,
    Group,
    Modal,
    rem,
    Text,
} from '@mantine/core';
import ApplicationName from 'components/about-test-runs/application-name';
import CountUpNumber from 'components/counter';
import { IconFilter, IconInfoCircle } from '@tabler/icons-react';
import type { optionForDateRange } from './filter-test-runs';
import FilterBox from './filter-test-runs';
import type { Dayjs } from 'dayjs';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useDisclosure } from '@mantine/hooks';

export function TestRunsPageHeader(properties: {
    totalRuns: number;
    recentRunDate: Dayjs;
    onDateRangeChange: (_: optionForDateRange[] | null) => void;
    onProjectFilterChange: (_: string | null) => void;
    about: string;
    allTestProjects: string[];
}): ReactNode {
    const [opened, { open, close }] = useDisclosure(false);
    return (
        <Group justify="space-between">
            <Group align="center">
                <Breadcrumbs>
                    <ApplicationName />
                    <Text size="sm">
                        Runs&nbsp;
                        <sup>
                            <CountUpNumber
                                prefix="("
                                suffix=")"
                                endNumber={properties.totalRuns}
                            />
                        </sup>
                    </Text>
                </Breadcrumbs>
                <Group align="center">
                    <IconFilter
                        color="white"
                        style={{ width: rem(15), height: rem(15) }}
                    />
                    <Divider orientation="vertical" />
                    <FilterBox
                        recentRunDate={properties.recentRunDate}
                        setOfProjects={[...new Set(properties.allTestProjects)]}
                        onDateRangeChange={properties.onDateRangeChange}
                        onProjectFilterChange={properties.onProjectFilterChange}
                    />
                </Group>
            </Group>
            <ActionIcon variant="default" onClick={open}>
                <IconInfoCircle style={{ width: rem(15), height: rem(15) }} />
            </ActionIcon>
            <Modal
                centered
                size="lg"
                opened={opened}
                onClose={close}
                title={'About'}
            >
                <MarkdownPreview
                    source={properties.about}
                    style={{ padding: '24px' }}
                />
            </Modal>
        </Group>
    );
}
