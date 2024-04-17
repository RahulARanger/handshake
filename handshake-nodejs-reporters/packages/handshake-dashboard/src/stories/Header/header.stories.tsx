import type { Meta, StoryObj } from '@storybook/react';
import { Chance } from 'chance';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import dayjs from 'dayjs';

const meta = {
    title: 'AboutTestRun/Overview/Header/Header',
    component: RunPageContent,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof RunPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const generator = new Chance();

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InOverviewTab: Story = {
    args: {
        where: 'Overview',
        projectName: generator.company(),
        startDate: dayjs(),
        children: <></>,
    },
};
