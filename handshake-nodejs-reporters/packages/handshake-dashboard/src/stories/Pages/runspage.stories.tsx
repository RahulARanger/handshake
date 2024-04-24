import type { Meta, StoryObj } from '@storybook/react';
import { RunsPageContent } from 'components/about-test-runs/test-runs-page-layout';
import { allPassed, mixed, onlySkipped } from 'stories/TestData/test-runs';
import { SWRConfig } from 'swr';
import React from 'react';

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
} satisfies Meta<typeof RunsPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const OnlyOneRun: Story = {
    decorators: [
        (Story) => {
            return (
                <SWRConfig value={{ fallbackData: [allPassed] }}>
                    <Story />
                </SWRConfig>
            );
        },
    ],
};
export const MultipleRuns: Story = {
    decorators: [
        (Story) => {
            return (
                <SWRConfig
                    value={{ fallbackData: [allPassed, mixed, onlySkipped] }}
                >
                    <Story />
                </SWRConfig>
            );
        },
    ],
};

// filter fails (for the timeline as expected) since we have duplicate keys
export const ScrollableRuns: Story = {
    decorators: [
        (Story) => {
            return (
                <SWRConfig
                    value={{
                        fallbackData: [
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
                    }}
                >
                    <Story />
                </SWRConfig>
            );
        },
    ],
};

export const NoTestRuns: Story = {
    decorators: [
        (Story) => {
            return (
                <SWRConfig value={{ fallbackData: [] }}>
                    <Story />
                </SWRConfig>
            );
        },
    ],
};

export const Loading: Story = {
    decorators: [
        (Story) => {
            return (
                <SWRConfig value={{ fallbackData: [onlySkipped] }}>
                    <Story forceLoading />
                </SWRConfig>
            );
        },
    ],
};
