import type { Meta, StoryObj } from '@storybook/nextjs';
import {
    allPassed,
    generateRandomProjects,
    generateTestRun,
} from 'stories/TestData/test-runs';
import OverviewPage from 'pages/RUNS/Overview';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Pages/OverviewOfTestRun',
    component: OverviewPage,
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
} satisfies Meta<typeof OverviewPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const AllPassed: Story = {
    args: {
        mockRun: allPassed,
        mockProjects: generateRandomProjects(allPassed),
    },
};

const randomRun = generateTestRun();
export const RandomRun: Story = {
    args: {
        mockRun: randomRun,
        mockProjects: generateRandomProjects(randomRun),
    },
};

export const LoadingState: Story = {
    args: {},
};

export const LoadingProjects: Story = {
    args: { mockRun: randomRun },
};
