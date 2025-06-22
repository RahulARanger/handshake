import type { Meta, StoryObj } from '@storybook/nextjs';
import { TimeRange } from 'components/timings/time-range';
import dayjs from 'dayjs';

const meta = {
    title: 'Timings/TimeRange',
    component: TimeRange,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TimeRange>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const DifferenceInHours: Story = {
    args: {
        startTime: dayjs(new Date()).subtract(3, 'hours'),
        endTime: dayjs(new Date()).subtract(1, 'hour'),
    },
};

export const DifferenceInMinutes: Story = {
    args: {
        startTime: dayjs(new Date()).subtract(5, 'minutes'),
        endTime: dayjs(new Date()).subtract(2, 'minutes'),
    },
};

export const DifferenceInSeconds: Story = {
    args: {
        startTime: dayjs(new Date()).subtract(5, 'seconds'),
        endTime: dayjs(new Date()).subtract(2, 'seconds'),
    },
};
