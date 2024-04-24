import type { Meta, StoryObj } from '@storybook/react';
import AreaChartForTestRuns from 'components/about-test-runs/area-test-runs';
import dayjs from 'dayjs';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRun/ListOfTestRuns/AreaChart',
    component: AreaChartForTestRuns,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof AreaChartForTestRuns>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MultipleRuns: Story = {
    args: {
        Rates: [
            { rate: [10, 1, 1], date: dayjs().subtract(3, 'day') },
            { rate: [20, 2, 5], date: dayjs().subtract(2, 'day') },
            { rate: [24, 4, 10], date: dayjs().add(1, 'hour') },
            { rate: [27, 1, 15], date: dayjs().add(2, 'hour') },
            { rate: [27, 1, 15], date: dayjs().add(3, 'hour') },
        ],
    },
};

export const MultipleRunsStackedPercent: Story = {
    args: {
        Rates: [
            { rate: [10, 1, 1], date: dayjs().subtract(3, 'day') },
            { rate: [20, 2, 5], date: dayjs().subtract(2, 'day') },
            { rate: [24, 4, 10], date: dayjs().add(1, 'hour') },
            { rate: [27, 1, 15], date: dayjs().add(2, 'hour') },
            { rate: [27, 1, 15], date: dayjs().add(3, 'hour') },
        ],
        percentStack: true,
    },
};

export const LargeNumberOfRuns: Story = {
    args: {
        Rates: [
            { rate: [10, 1, 1], date: dayjs().subtract(3, 'day') },
            { rate: [20, 2, 5], date: dayjs().subtract(2, 'day') },
            { rate: [24, 4, 10], date: dayjs().add(15, 'minutes') },
            { rate: [24, 4, 10], date: dayjs().add(30, 'minutes') },
            { rate: [24, 4, 10], date: dayjs().add(45, 'minutes') },
            { rate: [24, 4, 10], date: dayjs().add(60, 'minutes') },
            { rate: [24, 4, 10], date: dayjs().add(90, 'minutes') },
            { rate: [27, 1, 15], date: dayjs().add(2, 'hour') },
            { rate: [27, 1, 15], date: dayjs().add(3, 'hour') },
        ],
    },
};

export const SingleRun: Story = {
    args: {
        Rates: [{ rate: [10, 1, 1], date: dayjs().subtract(3, 'day') }],
    },
};
