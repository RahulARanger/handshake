import type { Meta, StoryObj } from '@storybook/react';
import RelativeDate from 'components/timings/relative-date';
import dayjs from 'dayjs';

const meta = {
    title: 'Timings/RelativeDate',
    component: RelativeDate,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RelativeDate>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const DifferenceInHours: Story = {
    args: {
        date: dayjs().subtract(3, 'hours'),
    },
};

export const RecentOne: Story = {
    args: {
        date: dayjs().subtract(3, 'second'),
    },
};

export const DifferenceInDays: Story = {
    args: {
        date: dayjs().subtract(3, 'days'),
    },
};

export const DifferenceInWeeks: Story = {
    args: {
        date: dayjs().subtract(3, 'weeks'),
    },
};

export const DifferenceInMonths: Story = {
    args: {
        date: dayjs().subtract(3, 'months'),
    },
};
