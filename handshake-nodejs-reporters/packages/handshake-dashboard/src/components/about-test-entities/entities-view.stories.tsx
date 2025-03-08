import type { Meta, StoryObj } from '@storybook/react';
import EntitiesView from 'pages/RUNS/Suites';
import { allPassed, generateRandomProjects } from 'stories/TestData/test-runs';
import { generateTestSuiteFromTestRun } from 'stories/TestData/test-suites';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'AboutTestRun/EntitiesView',
    component: EntitiesView,
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
} satisfies Meta<typeof EntitiesView>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

const randomRunWithSuites = generateTestSuiteFromTestRun();

export const randomRun: Story = {
    args: {
        mockRun: randomRunWithSuites.run,
        mockSuites: randomRunWithSuites.suites,
    },
};
