import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import DetailedTestView from './detailed-test-view';
import { Chance } from 'chance';
import {
    generateSampleAssertion,
    generateSampleTestCase,
    generateSampleWrittenAttachment,
    generator,
} from 'stories/TestData/test-case';

const meta = {
    title: 'AboutTestCase/DetailedTestView',
    component: DetailedTestView,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: { setImagePreview: fn() },
} satisfies Meta<typeof DetailedTestView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleTestCaseView: Story = {
    args: {
        testID: generator.unique(generator.state, 1)[0],
        test: generateSampleTestCase(),
    },
};

export const LoadingState: Story = {
    args: {
        testID: generator.unique(generator.state, 1)[0],
        test: generateSampleTestCase(),
        simulateLoading: true,
        attachmentsAreLoading: true,
    },
};

export const WithImageAttachments: Story = {
    args: {
        testID: generator.unique(generator.state, 1)[0],
        test: generateSampleTestCase(),
        simulateLoading: true,
        writtenAttachmentsForSuites: generator.n(
            generateSampleWrittenAttachment,
            generator.integer({ min: 3, max: 6 }),
        ),
    },
};

export const WithAssertions: Story = {
    args: {
        testID: generator.unique(generator.state, 1)[0],
        test: generateSampleTestCase(),
        simulateLoading: true,
        assertions: generator.n(generateSampleAssertion, 6),
    },
};
