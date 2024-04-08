import type { Meta, StoryObj } from '@storybook/react';
import OverviewCard from 'components/about-test-run/test-status-ring';
import dayjs from 'dayjs';

const meta = {
    title: 'AboutTestRun/OverviewCard',
    component: OverviewCard,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof OverviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InOverviewTab: Story = {
    args: {
        at: dayjs().subtract(1, 'hour'),
        rate: [10, 1, 2],
        suites: [1, 1, 1],
        duration: dayjs.duration({ seconds: 10 }),
        totalSuites: 3,
        totalTests: 13,
        durations: [dayjs.duration({ minutes: 2 }).asSeconds()],
        testCounts: [10],
        failedCountsForSuites: [1],
        passedCountsForTests: [1],
        failedCountsForTests: [1],
        passedCountForSuites: [1],
    },
};

export const LargeNumber: Story = {
    args: {
        at: dayjs().subtract(4, 'hours'),
        rate: [1000, 100, 200],
        suites: [100, 100, 100],
        duration: dayjs.duration({ hours: 3 }),
        totalSuites: 300,
        totalTests: 1300,
        durations: [
            dayjs.duration({ hours: 2 }).asSeconds(),
            dayjs.duration({ hours: 2.4 }).asSeconds(),
            dayjs.duration({ hours: 3 }).asSeconds(),
        ],
        testCounts: [900, 1000, 1300],
        passedCountForSuites: [80, 90, 100],
        failedCountsForSuites: [120, 110, 100],
        passedCountsForTests: [800, 900, 1000],
        failedCountsForTests: [80, 90, 100],
        startTime: dayjs().subtract(4, 'hours'),
        endTime: dayjs().subtract(1, 'hours'),
    },
};
