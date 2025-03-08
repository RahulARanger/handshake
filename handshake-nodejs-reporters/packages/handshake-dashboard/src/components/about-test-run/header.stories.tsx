import type { Meta, StoryObj } from '@storybook/react';
import { allPassed } from 'stories/TestData/test-runs';
import Header from './header';
import { AppShell } from '@mantine/core';

const meta = {
    title: 'AboutTestRun/Header',
    component: Header,
    tags: ['autodocs'],
    render: (arguments_) => {
        return (
            <AppShell>
                <Header {...arguments_} />
            </AppShell>
        );
    },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SampleRun: Story = {
    args: {
        forceTestRunRecord: allPassed,
        where: 'Overview',
        testID: allPassed.testID,
    },
};
