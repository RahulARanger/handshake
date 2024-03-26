import type { Meta, StoryObj } from '@storybook/react';
import { ListOfRuns } from 'components/about-test-runs/run-cards';
import { allPassed, mixed, onlySkipped } from 'stories/TestData/test-runs';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRun/ListOfTestRuns/Timeline',
    component: ListOfRuns,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof ListOfRuns>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const OnlyOneRun: Story = {
    args: {
        mah: 250,
        runs: [allPassed],
    },
};

export const MultipleRuns: Story = {
    args: {
        runs: [allPassed, mixed, onlySkipped],
        mah: 500,
    },
};

export const ScrollableRuns: Story = {
    args: {
        runs: [allPassed, mixed, onlySkipped, allPassed, mixed],
        mah: '75vh',
    },
};

export const PaginatedRuns: Story = {
    args: {
        runs: [
            allPassed,
            mixed,
            onlySkipped,
            allPassed,
            mixed,
            allPassed,
            mixed,
            onlySkipped,
            allPassed,
            mixed,
        ],
        mah: '75vh',
        pageSize: 3,
    },
};
