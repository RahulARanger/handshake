import type { Meta, StoryObj } from '@storybook/react';
import { generateTestRunForDemo } from 'stories/TestData/test-runs';
import { RunsPageContent } from './test-runs-page-layout';
import { useState } from 'react';
import { useInterval } from '@mantine/hooks';
import React from 'react';

function DemoRunsPageContent() {
    const [mockData, setMockData] = useState(generateTestRunForDemo());

    useInterval(
        () => {
            setMockData(() => generateTestRunForDemo());
        },
        3000,
        { autoInvoke: true },
    );

    return <RunsPageContent mockData={mockData} />;
}

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Demo/RunsPageContent',
    component: DemoRunsPageContent,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
        fullscreen: true,
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    args: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof DemoRunsPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const DemoPage: Story = {};
