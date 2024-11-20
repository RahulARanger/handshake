import type { Meta, StoryObj } from '@storybook/react';
import OverviewCard from './overview-of-test-card';
import {
    allPassed,
    generateRandomProjects,
    mixed,
} from 'stories/TestData/test-runs';
import transformTestRunRecord from 'extractors/transform-run-record';
import { Card, ScrollAreaAutosize } from '@mantine/core';

const projects = generateRandomProjects();
const randomProject = Array.from(Object.keys(projects))[0];

function SimulateOverViewCard(args: typeof OverviewCard) {
    // this is to simulate the dashboard view in desktop
    return (
        <ScrollAreaAutosize w={700} m="sm">
            <OverviewCard {...args} />
        </ScrollAreaAutosize>
    );
}

const meta = {
    title: 'AboutTestRun/OverviewCard',
    component: SimulateOverViewCard,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof SimulateOverViewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const PassedRun: Story = {
    args: {
        run: transformTestRunRecord({
            ...allPassed,
            projectName: randomProject,
        }),
        mockData: projects,
    },
};

export const RecentRun: Story = {
    args: {
        run: transformTestRunRecord({
            ...mixed,
            projectName: randomProject,
            projectIndex: 1,
        }),
        mockData: projects,
    },
};
