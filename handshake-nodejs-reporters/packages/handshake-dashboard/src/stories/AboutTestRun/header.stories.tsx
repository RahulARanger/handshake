import type { Meta, StoryObj } from '@storybook/react';
import Header from 'components/about-test-run/header';
import dayjs from 'dayjs';

const meta = {
    title: 'AboutTestRun/Header',
    component: Header,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InOverviewTab: Story = {
    args: {
        inOverview: true,
        date: dayjs().subtract(1, 'hour'),
        projectName: 'overview-page-header',
    },
};
