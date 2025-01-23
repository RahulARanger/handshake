import type { Meta, StoryObj } from '@storybook/react';
import { OnPlatform } from 'components/about-test-run/platform-icon';

const meta = {
    title: 'AboutTestRun/RanOnPlatform',
    component: OnPlatform,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof OnPlatform>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Windows: Story = {
    args: {
        platform: 'win32',
    },
};

export const Linux: Story = {
    args: {
        platform: 'linux',
    },
};

export const Macos: Story = {
    args: {
        platform: 'mac64',
    },
};
