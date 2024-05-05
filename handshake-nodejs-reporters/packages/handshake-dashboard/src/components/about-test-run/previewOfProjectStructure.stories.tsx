import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect, fireEvent, waitFor } from '@storybook/test';
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
                current: 'features\\login-2.feature',
                suites: 10,
                paths: {},
            },
            'features\\login-3.feature': {
                current: 'features\\login-3.feature',
                suites: 1,
                paths: {},
            },
            'features\\login-4.feature': {
                current: 'features\\login-4.feature',
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
                        current: 'specs\\login.feature',
                        paths: {},
                        suites: 16,
                    },
                    'login-2.feature': {
                        current: 'specs\\login-2.feature',
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
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of the tree parts', async () => {
            await screen.findAllByText('login.feature');
            await screen.findAllByText('login-2.feature');
        });
        await step(
            'testing the tooltip content of the tree parts',
            async () => {
                const loginFeature = (
                    await screen.findAllByText('login.feature')
                )[0];
                await userEvent.hover(loginFeature);

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
        specStructure: {
            features: {
                current: 'features',
                paths: {
                    specs: {
                        current: 'features/specs',
                        paths: {
                            test: {
                                current: 'features/specs/tests',
                                paths: {
                                    'test-login.feature': {
                                        current:
                                            'features\\specs\\tests\\login.feature',
                                        paths: {},
                                        suites: 16,
                                    },
                                    'test-login-2.feature': {
                                        current:
                                            'features\\specs\\tests\\login-2.feature',
                                        paths: {},
                                        suites: 10,
                                    },
                                    fixes: {
                                        current: 'features/specs/tests/fixes',
                                        paths: {
                                            'fix-login.feature': {
                                                current:
                                                    'features\\specs\\tests\\fixes\\login.feature',
                                                paths: {},
                                                suites: 16,
                                            },
                                            'fix-login-2.feature': {
                                                current:
                                                    'features\\specs\\tests\\fixes\\login-2.feature',
                                                paths: {},
                                                suites: 10,
                                            },
                                        },
                                    },
                                },
                            },
                        },
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
    play: async ({ canvasElement, step }) => {
        const screen = within(canvasElement);

        await step('testing the presence of the tree parts', async () => {
            await waitFor(
                () =>
                    expect(
                        screen.findByText('test-login.feature'),
                    ).toBeInTheDocument(),
                { timeout: 10e3 },
            );
        });
        await step(
            'testing the tooltip content of the tree parts',
            async () => {
                const loginFeature = screen.queryByText(
                    'fix-login-2.feature',
                ) as HTMLElement;
                expect(loginFeature).not.toBeNull();
                await userEvent.hover(loginFeature);

                await expect(
                    screen.getByLabelText('file-name'),
                ).toHaveTextContent('fix-login-2.feature');
                await expect(
                    screen.getByLabelText('file-path'),
                ).toHaveTextContent(
                    'features\\specs\\tests\\fixes\\login-2.feature',
                );
                await waitFor(
                    async () => {
                        const text =
                            screen.queryByLabelText(
                                'file-details',
                            )?.textContent;
                        return text?.includes('Tests: 10');
                    },
                    { timeout: 10e3 },
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
