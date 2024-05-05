import type { Meta, StoryObj } from '@storybook/react';
import PassedRate from 'components/about-test-run/passed-rate';

const meta = {
    title: 'AboutTestRun/PassedRate',
    component: PassedRate,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PassedRate>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Mixed: Story = {
    args: {
        rate: [100, 20, 20],
        text: 'Tests',
    },
};

export const OnlyFailed: Story = {
    args: {
        rate: [0, 0, 100],
        text: 'Suites',
    },
};

export const OnlyPassed: Story = {
    args: {
        rate: [100, 0, 0],
        text: 'Tests',
    },
};

export const OnlySkipped: Story = {
    args: {
        rate: [0, 100, 0],
        text: 'Tests',
    },
};
