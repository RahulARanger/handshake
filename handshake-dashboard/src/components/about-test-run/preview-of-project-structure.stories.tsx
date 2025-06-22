import type { Meta, StoryObj } from '@storybook/nextjs';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { PreviewOfProjectStructure } from './preview-run';
import {
    evenMoreDepth,
    simpleStructure,
    withMoreDepth,
    withTwoDirectories,
} from 'stories/TestData/spec-structures';
import React from 'react';

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
        specStructure: simpleStructure,
    },
    render: (arguments_) => (
        <div style={{ width: '500px' }}>
            <PreviewOfProjectStructure
                specStructure={arguments_.specStructure}
            />
        </div>
    ),
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of the tree parts', async () => {
            await screen.findByText('features\\login.feature');
            await screen.findByText('features\\login-2.feature');
            await expect(
                screen.queryByText('feature\\login-3.feature'),
            ).not.toBeInTheDocument(); // it would be truncated due to very low value
            await expect(
                screen.queryByText('feature\\login-4.feature'),
            ).not.toBeInTheDocument();
        });
        await step(
            'testing the tooltip content of the tree parts',
            async () => {
                const loginFeature = await screen.findByText(
                    'features\\login.feature',
                );
                await userEvent.hover(loginFeature);

                await expect(
                    screen.queryByLabelText('file-name'),
                ).toHaveTextContent('features\\login.feature');
                await expect(
                    screen.queryByLabelText('file-path'),
                ).toHaveTextContent('features\\login.feature');
                await waitFor(
                    async () => {
                        const text =
                            screen.queryByLabelText(
                                'file-details',
                            )?.textContent;
                        return text?.includes('Tests: 16');
                    },
                    { timeout: 10e3 },
                );
            },
        );
    },
};

export const TwoDirectories: Story = {
    args: {
        specStructure: withTwoDirectories,
    },
    render: (arguments_) => (
        <div style={{ width: '500px' }}>
            <PreviewOfProjectStructure
                specStructure={arguments_.specStructure}
            />
        </div>
    ),
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of the tree parts', async () => {
            await screen.findAllByText('login.feature');
            await screen.findAllByText('login-2.feature');
        });
        await step(
            'testing the tooltip content of the tree parts',
            async () => {
                const loginFeatures =
                    await screen.findAllByText('login.feature');
                await userEvent.hover(loginFeatures[0]);

                await expect(
                    screen.queryByLabelText('file-name'),
                ).toHaveTextContent('login.feature');
                await expect(
                    screen.queryByLabelText('file-path'),
                ).toHaveTextContent('specs\\login.feature');
                await waitFor(
                    async () => {
                        const text =
                            screen.queryByLabelText(
                                'file-details',
                            )?.textContent;
                        return text?.includes('Tests: 16');
                    },
                    { timeout: 10e3 },
                );
            },
        );
    },
};

export const WithMoreDepth: Story = {
    args: {
        specStructure: withMoreDepth,
    },
    render: (arguments_) => (
        <div style={{ width: '500px' }}>
            <PreviewOfProjectStructure
                specStructure={arguments_.specStructure}
                quick
            />
        </div>
    ),
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of the tree parts', async () => {
            expect(
                await screen.findByText('test-login-2.feature'),
            ).not.toBeNull();
            expect(
                await screen.findByText('test-login.feature'),
            ).not.toBeNull();
            expect(
                await screen.findByText('fix-login-2.feature'),
            ).not.toBeNull();
            expect(await screen.findByText('fix-login.feature')).not.toBeNull();
        });
        await step(
            'testing the tooltip content of the tree parts',
            async () => {
                const loginFeature = await screen.findByText(
                    'test-login-2.feature',
                );
                await userEvent.hover(loginFeature);

                await expect(
                    screen.getByLabelText('file-name'),
                ).toHaveTextContent('login-2.feature');
                await expect(
                    screen.getByLabelText('file-path'),
                ).toHaveTextContent('features\\specs\\tests\\login-2.feature');
            },
        );
        await step(
            'testing the tooltip content of the node at deepest level',
            async () => {
                const loginFeature = await screen.findByText(
                    'fix-login-2.feature',
                );
                await userEvent.hover(loginFeature);

                await expect(
                    screen.getByLabelText('file-name'),
                ).toHaveTextContent('fix-login-2.feature');
                await expect(
                    screen.getByLabelText('file-path'),
                ).toHaveTextContent(
                    'features\\specs\\tests\\fixes\\login-2.feature',
                );
            },
        );
    },
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

export const EvenMoreDepth: Story = {
    args: {
        specStructure: evenMoreDepth,
    },
    render: (arguments_) => (
        <div style={{ width: '500px' }}>
            <PreviewOfProjectStructure
                specStructure={arguments_.specStructure}
                quick
            />
        </div>
    ),
};
