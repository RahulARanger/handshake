import { Box, Group, MultiSelect, rem, Select } from '@mantine/core';
import { IconPerspective, IconHistory } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import isBetween from 'dayjs/plugin/isBetween';
import React, { useMemo } from 'react';

// rarely used in other pages so extending here (whenever necessary)
dayjs.extend(isBetween);

export type optionForDateRange =
    | 'This Year'
    | 'This Month'
    | 'This Week'
    | 'Today'
    | 'Yesterday'
    | 'This Year'
    | 'Oldest'
    | 'Last Month'
    | 'Last Week';

export const optionsForDate: optionForDateRange[] = [
    'Oldest',
    'This Year',
    'Last Month',
    'This Month',
    'Last Week',
    'This Week',
    'Yesterday',
    'Today',
]; // we had it in reverse so we can pop it easily

export default function FilterBox(properties: {
    recentRunDate: dayjs.Dayjs;
    setOfProjects: string[];
    onDateRangeChange: (dateRanges: optionForDateRange[] | null) => void;
    onProjectFilterChange: (projectName: string | null) => void;
}): ReactNode {
    const options = useMemo<optionForDateRange[]>(() => {
        const optionsForDateRangeCopy = [...optionsForDate];
        const today = dayjs().utc().local();

        if (!today.isSame(properties.recentRunDate, 'date')) {
            // removing today
            optionsForDateRangeCopy.pop();

            if (
                !today
                    .subtract(1, 'day')
                    .isSame(properties.recentRunDate, 'date')
            ) {
                // removing yesterday
                optionsForDateRangeCopy.pop();

                if (
                    !properties.recentRunDate.isBetween(
                        today.startOf('week'),
                        today,
                        'date',
                        '[)',
                    )
                ) {
                    // removing this week
                    optionsForDateRangeCopy.pop();

                    if (
                        !properties.recentRunDate.isBetween(
                            today
                                .startOf('week')
                                .subtract(1, 'day')
                                .startOf('week'),
                            today,
                            'date',
                            '[)',
                        )
                    ) {
                        // removing last week
                        optionsForDateRangeCopy.pop();

                        if (
                            !properties.recentRunDate.isBetween(
                                today.startOf('month'),
                                today,
                                'date',
                                '[)',
                            )
                        ) {
                            // removing this month
                            optionsForDateRangeCopy.pop();
                            if (
                                !properties.recentRunDate.isBetween(
                                    today
                                        .startOf('month')
                                        .subtract(1, 'day')
                                        .startOf('month'),
                                    today,
                                    'date',
                                    '[)',
                                )
                            ) {
                                // removing last month
                                optionsForDateRangeCopy.pop();

                                if (
                                    !properties.recentRunDate.isBetween(
                                        today.startOf('year'),
                                        today,
                                        'date',
                                        '[)',
                                    )
                                ) {
                                    // removing last year
                                    optionsForDateRangeCopy.pop();
                                }
                            }
                        }
                    }
                }
            }
        }

        optionsForDateRangeCopy.reverse();
        return optionsForDateRangeCopy;
    }, [properties.recentRunDate]);

    return (
        <Box>
            <Group justify="space-around">
                <Select
                    size="xs"
                    data={properties.setOfProjects}
                    defaultValue={
                        properties.setOfProjects.length > 1
                            ? undefined
                            : properties.setOfProjects[0]
                    }
                    onChange={(value) =>
                        properties.onProjectFilterChange(value)
                    }
                    clearable
                    comboboxProps={{
                        position: 'bottom',
                        middlewares: { flip: false, shift: false },
                        offset: 0,
                    }}
                    placeholder="Filter by Project Name"
                    leftSection={
                        <IconPerspective
                            style={{ width: rem(15), height: rem(15) }}
                        />
                    }
                    aria-label="filter-projects"
                />
                <MultiSelect
                    size="xs"
                    data={options}
                    style={{ minWidth: rem(150) }}
                    placeholder="Filter by Date Range"
                    comboboxProps={{
                        position: 'bottom',
                        middlewares: { flip: false, shift: false },
                        offset: 0,
                    }}
                    maxValues={5}
                    clearable
                    onChange={(_) =>
                        properties.onDateRangeChange(_ as optionForDateRange[])
                    }
                    leftSection={
                        <IconHistory
                            style={{ width: rem(15), height: rem(15) }}
                        />
                    }
                />
            </Group>
        </Box>
    );
}
