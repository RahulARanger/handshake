import type { Meta, StoryObj } from '@storybook/react';
import { RunsPageContent } from 'components/about-test-runs/test-run-page-layout';
import { allPassed, mixed, onlySkipped } from 'stories/TestData/test-runs';

const resp = await fetch('/about.md');
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Pages/RunsPage',
    component: RunsPageContent,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { about: await resp.text() },
} satisfies Meta<typeof RunsPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const OnlyOneRun: Story = {
    args: {
        runs: [allPassed],
    },
};

export const MultipleRuns: Story = {
    args: {
        runs: [allPassed, mixed, onlySkipped],
    },
};

// filter fails (for the timeline as expected) since we have duplicate keys
export const ScrollableRuns: Story = {
    args: {
        runs: [
            allPassed,
            allPassed,
            allPassed,
            mixed,
            mixed,
            mixed,
            onlySkipped,
            onlySkipped,
            onlySkipped,
        ],
    },
};

export const NoTestRuns: Story = {
    args: {
        runs: [],
    },
};
