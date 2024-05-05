import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { PreviewOfProjectStructure } from './preview-run';
import { specNode } from 'types/test-run-records';

const meta = {
    title: 'AboutTestRun/PreviewOfProjectStructure',
    component: PreviewOfProjectStructure,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PreviewOfProjectStructure>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SimpleStructure: Story = {
    args: {
        specStructure: {
            'features\\login.feature': {
                current: 'features\\login.feature',
                suites: 16,
                paths: {},
            },
            'features\\login-2.feature': {
                current: 'features\\login.feature',
                suites: 10,
                paths: {},
            },
            'features\\login-3.feature': {
                current: 'features\\login.feature',
                suites: 1,
                paths: {},
            },
            'features\\login-4.feature': {
                current: 'features\\login.feature',
                suites: 0,
                paths: {},
            },
        },
    },
    render: (args) => (
        <div style={{ width: '500px' }}>
            <PreviewOfProjectStructure specStructure={args.specStructure} />
        </div>
    ),
};

export const TwoDirectories: Story = {
    args: {
        specStructure: {
            features: {
                current: 'features',
                paths: {
                    'login.feature': {
                        current: 'features\\login.feature',
                        paths: {},
                        suites: 16,
                    },
                    'login-2.feature': {
                        current: 'features\\login-2.feature',
                        paths: {},
                        suites: 10,
                    },
                },
            },
            specs: {
                current: 'specs',
                paths: {
                    'login.feature': {
                        current: 'features\\login.feature',
                        paths: {},
                        suites: 16,
                    },
                    'login-2.feature': {
                        current: 'features\\login-2.feature',
                        paths: {},
                        suites: 10,
                    },
                },
            },
        },
    },
    render: (args) => (
        <div style={{ width: '500px' }}>
            <PreviewOfProjectStructure specStructure={args.specStructure} />
        </div>
    ),
};

export const LoadingState: Story = {
    args: {
        w: '500px',
    },
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of loading state', async () => {
            await expect(
                screen.getByLabelText('loading-project-structure'),
            ).toBeInTheDocument();
        });
    },
};
