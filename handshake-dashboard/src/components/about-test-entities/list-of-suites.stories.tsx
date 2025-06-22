import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/nextjs';
import EntitiesView from 'pages/RUNS/Suites';
import { generateTestHierarchyWithSuites } from 'stories/TestData/test-suites';

const WindowComp = (properties: typeof EntitiesView) => (
    <Box ml="-10px">
        <EntitiesView {...properties} />
    </Box>
);

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Pages/Suites',
    component: WindowComp,
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

const randomRunWithSuites = generateTestHierarchyWithSuites();

export const randomRun: Story = {
    args: {
        mockRun: randomRunWithSuites.run,
        mockSuites: randomRunWithSuites.suites,
    },
};
