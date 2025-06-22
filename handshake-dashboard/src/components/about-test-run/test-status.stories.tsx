import type { Meta, StoryObj } from '@storybook/nextjs';
import TestStatusIcon from './test-status';

const meta = {
    title: 'AboutTestRun/TestStatusIcon',
    component: TestStatusIcon,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof TestStatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const PassedRun: Story = {
    args: {
        status: 'PASSED',
    },
};

export const SkippedRun: Story = {
    args: {
        status: 'SKIPPED',
    },
};

export const FailedRun: Story = {
    args: {
        status: 'FAILED',
    },
};

export const XFailedRun: Story = {
    args: {
        status: 'XFAILED',
    },
};

export const XPassedRun: Story = {
    args: {
        status: 'XPASSED',
    },
};
