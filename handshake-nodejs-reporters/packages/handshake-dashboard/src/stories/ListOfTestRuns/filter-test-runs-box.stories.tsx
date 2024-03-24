import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import FilterBox from 'components/about-test-runs/filter-test-runs';
import dayjs from 'dayjs';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRun/ListOfTestRuns/FilterTestRuns',
    component: FilterBox,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    args: { onProjectFilterChange: fn(), onDateRangeChange: fn() },
} satisfies Meta<typeof FilterBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MultipleProjects: Story = {
    args: {
        recentRunDate: dayjs(),
        setOfProjects: [
            'smoke',
            'regression',
            'sanity',
            'test-run-with-really-long-name',
        ],
    },
};

export const SingleProject: Story = {
    args: {
        recentRunDate: dayjs(),
        setOfProjects: ['sanity'],
    },
};

export const WithToday: Story = {
    args: {
        recentRunDate: dayjs(),
        setOfProjects: ['sanity'],
    },
};

export const FromYesterday: Story = {
    args: {
        recentRunDate: dayjs().subtract(1, 'day'),
        setOfProjects: ['sanity'],
    },
};

export const WithThisWeek: Story = {
    args: {
        recentRunDate: dayjs().startOf('week'),
        setOfProjects: ['sanity'],
    },
};

export const WithThisLastWeek: Story = {
    args: {
        recentRunDate: dayjs()
            .startOf('week')
            .subtract(1, 'day')
            .startOf('week'),
        setOfProjects: ['sanity'],
    },
};

export const WithThisMonth: Story = {
    args: {
        recentRunDate: dayjs().startOf('month'),
        setOfProjects: ['sanity'],
    },
};
export const FromPreviousMonth: Story = {
    args: {
        recentRunDate: dayjs()
            .startOf('month')
            .subtract(1, 'day')
            .startOf('month'),
        setOfProjects: ['sanity'],
    },
};
export const FromThisYear: Story = {
    args: {
        recentRunDate: dayjs().startOf('year'),
        setOfProjects: ['sanity'],
    },
};
export const SoOld: Story = {
    args: {
        recentRunDate: dayjs().subtract(3, 'years'),
        setOfProjects: ['sanity'],
    },
};
