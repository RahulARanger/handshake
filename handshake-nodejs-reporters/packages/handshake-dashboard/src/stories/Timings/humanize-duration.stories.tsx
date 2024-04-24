import type { Meta, StoryObj } from '@storybook/react';
import { HumanizedDuration } from 'components/timings/humanized-duration';
import dayjs from 'dayjs';
import Duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(Duration);

const meta = {
    title: 'Timings/HumanizedDuration',
    component: HumanizedDuration,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof HumanizedDuration>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InHours: Story = {
    args: {
        duration: dayjs.duration({ hours: 1, minutes: 30 }),
    },
};

export const InMinutes: Story = {
    args: {
        duration: dayjs.duration({ minutes: 30 }),
    },
};

export const InSeconds: Story = {
    args: {
        duration: dayjs.duration({ seconds: 10 }),
    },
};

export const WithPrefix: Story = {
    args: {
        duration: dayjs.duration({ minutes: 10, seconds: 10 }),
        prefix: 'Ran ',
    },
};
