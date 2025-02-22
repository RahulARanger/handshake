import type { Meta, StoryObj } from '@storybook/react';
import { NotedValues } from './overview-of-test-card';
import {
    allPassed,
    generateRandomPlatforms,
    generateTestRun,
    onlyFailed,
    onlySkipped,
    onlyXFailed,
    onlyXPassed,
} from 'stories/TestData/test-runs';
import transformTestRunRecord from 'extractors/transform-run-record';

const meta = {
    title: 'AboutTestRun/NotedValues',
    component: NotedValues,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof NotedValues>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const AllPassed: Story = {
    args: {
        testRunRecord: transformTestRunRecord(allPassed),
    },
};

export const AllSkipped: Story = {
    args: {
        testRunRecord: transformTestRunRecord(onlySkipped),
    },
};

export const AllFailed: Story = {
    args: {
        testRunRecord: transformTestRunRecord(onlyFailed),
    },
};

export const AllXFailed: Story = {
    args: {
        testRunRecord: transformTestRunRecord(onlyXFailed),
    },
};

export const AllXPassed: Story = {
    args: {
        testRunRecord: transformTestRunRecord(onlyXPassed),
    },
};
export const SampleTestRun: Story = {
    args: {
        testRunRecord: transformTestRunRecord(generateTestRun()),
        rawForceFeedPlatforms: generateRandomPlatforms(),
    },
};
