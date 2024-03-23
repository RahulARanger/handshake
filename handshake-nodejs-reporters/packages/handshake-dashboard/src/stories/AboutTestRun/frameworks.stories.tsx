import type { Meta, StoryObj } from '@storybook/react';
import { FrameworksUsed } from 'components/about-test-run/framework-icons';

const meta = {
    title: 'AboutTestRun/FrameworksUsed',
    component: FrameworksUsed,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof FrameworksUsed>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MultipleFrameworksUsed: Story = {
    args: {
        frameworks: ['webdriverio', 'mocha', 'jasmine'],
    },
};

export const NoFrameworksUsed: Story = {
    args: {
        frameworks: [],
    },
};

export const Webdriverio: Story = {
    args: {
        frameworks: ['webdriverio'],
    },
};

export const Mocha: Story = {
    args: {
        frameworks: ['mocha'],
    },
};

export const Cucumber: Story = {
    args: {
        frameworks: ['cucumber'],
    },
};

export const Jasmine: Story = {
    args: {
        frameworks: ['jasmine'],
    },
};

export const Unknown: Story = {
    args: {
        frameworks: ['unknown'],
    },
};
