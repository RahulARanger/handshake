import type { Meta, StoryObj } from '@storybook/react';
import { Chance } from 'chance';
import RunPageContent from 'components/about-test-run/test-run-page-layout';
import dayjs from 'dayjs';
import { allPassed } from 'stories/TestData/test-runs';
import { SWRConfig } from 'swr';

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

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InOverviewTab: Story = {
    decorators: [
        (Story) => {
            return (
                <SWRConfig value={{ fallbackData: allPassed }}>
                    <Story />
                </SWRConfig>
            );
        },
    ],
    args: {
        where: 'Overview',
        testID: allPassed.testID,
        children: <></>,
    },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InOverviewTabLoading: Story = {
    args: {
        where: 'Overview',
        children: <></>,
    },
};
