import type { ReactNode } from 'react';
import React, { useState } from 'react';
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
import type { optionForDateRange } from './filters';
import FilterBox from './filters';
import type { Dayjs } from 'dayjs';
import MarkdownPreview from '@uiw/react-markdown-preview';

export function TestRunsPageHeader(properties: {
    totalRuns: number;
    recentRunDate: Dayjs;
    onDateRangeChange: (_: optionForDateRange[] | null) => void;
    onProjectFilterChange: (_: string | null) => void;
    about: string;
    allTestProjects: string[];
}): ReactNode {
    const [openReadMe, setOpenReadMe] = useState(false);
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
            <ActionIcon variant="default" onClick={() => setOpenReadMe(true)}>
                <IconInfoCircle style={{ width: rem(15), height: rem(15) }} />
            </ActionIcon>
            <Modal
                opened={openReadMe}
                onClose={() => setOpenReadMe(false)}
                title={<ApplicationName />}
            >
                <MarkdownPreview
                    source={properties.about}
                    style={{ padding: '24px' }}
                />
                hello there
            </Modal>
        </Group>
    );
}
