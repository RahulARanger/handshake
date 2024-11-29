import type { Meta, StoryObj } from '@storybook/react';
import { allPassed, mixed } from 'stories/TestData/test-runs';
import TestRunCard from './run-card';
import transformTestRunRecord from 'extractors/transform-run-record';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRuns/RunCard',
    component: TestRunCard,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    args: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof TestRunCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const PassedRun: Story = {
    args: {
        run: transformTestRunRecord(allPassed),
    },
};

export const InterruptedRun: Story = {
    args: {
        run: transformTestRunRecord({ ...mixed, status: 'INTERRUPTED' }),
    },
};

export const RunWithInternalError: Story = {
    args: {
        run: transformTestRunRecord({ ...mixed, status: 'INTERNAL_ERROR' }),
    },
};
